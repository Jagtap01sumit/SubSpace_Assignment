const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();
require('dotenv').config();

const memoizedBlogStats = _.memoize(
  fetchBlogStatistics,
  (url, adminSecret, query) => {
    return url + adminSecret + query;
  }
);

const BLOG_API_URL = "https://intent-kit-16.hasura.app/api/rest/blogs";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

app.get("/api/blog-stats", async (req, res) => {
  try {
    const blogStats = await memoizedBlogStats(
      BLOG_API_URL,
      ADMIN_SECRET,
      "all"
    );
    res.json(blogStats);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/blog-search", async (req, res) => {
  const query = req.query.query;

  try {
    const blogStats = await memoizedBlogStats(
      BLOG_API_URL,
      ADMIN_SECRET,
      query
    );
    const searchResults = blogStats.uniqueBlogTitles.filter((title) =>
      title.toLowerCase().includes(query.toLowerCase())
    );
    res.json({ results: searchResults });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


async function fetchBlogStatistics(url, adminSecret, query) {
  const response = await axios.get(url, {
    headers: {
      "x-hasura-admin-secret": adminSecret,
    },
  });

  const blogData = response.data;
  const totalBlogs = blogData.length;
  const longestTitleBlog = _.maxBy(blogData, "title.length");
  const blogsWithPrivacy = _.filter(blogData, (blog) =>
    _.includes(_.toLower(blog.title), "privacy")
  );
  const uniqueBlogTitles = _.uniqBy(blogData, "title");

  return {
    totalBlogs,
    longestTitle: longestTitleBlog.title,
    blogsWithPrivacy: blogsWithPrivacy.length,
    uniqueBlogTitles: uniqueBlogTitles.map((blog) => blog.title),
  };
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
