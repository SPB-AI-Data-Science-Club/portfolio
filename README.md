# SPB AI & Data Science Club - Website

The club's public site: [spbdatascience.org](https://spbdatascience.org)

Static HTML/CSS/JS, served by nginx. Three pages (home, about, projects) plus a live GPU status indicator showing whether the club's RTX 5080 compute server is online.

## Structure

```
index.html      home: hero, club stats, featured projects
about.html      what the club does, competitions, resources
projects.html   all nine live projects with source links
css/style.css   single stylesheet, dark theme
```

All nine project demos are deployed as subdomains and linked from the projects page; each has its own repository in this organization.
