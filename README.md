# Sandbox Round 1 Challenge

### Improvements from Summer Submission

-   Added static type checking with rewrite in TypeScript.
-   Fixed potential bug if two courses have the same classId.
-   Fixed potential bug with http `get` helper erroring on large requests.
-   Added filter to courses as they are taken to avoid looping through all courses on every iteration, increasing efficiency.
-   Added a lot more comments and documentation about the algorithm.
