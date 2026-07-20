# Day 13 Learnings: API Documentation with OpenAPI and Swagger

## What I Learned

Today I learned how to design, publish, and maintain production-style API documentation using OpenAPI and Swagger UI.

1. I learned how to structure an OpenAPI 3.0 specification for a real backend service.
- define API metadata (`title`, `version`, `description`, `contact`)
- configure environment-specific servers for local development
- organize reusable components under `schemas` and `securitySchemes`
- keep schema definitions aligned with actual API response shapes

2. I learned how to document authentication in API docs.
- configure bearer token authentication under `components.securitySchemes`
- explain how JWT should be sent in the `Authorization` header
- make protected endpoint behavior clear for API consumers
- keep auth documentation consistent across routes

3. I learned how to model reusable request/response schemas.
- document nested models like user preferences and profile objects
- include validation hints such as enum values, formats, defaults, and max lengths
- provide realistic examples for IDs, timestamps, and token responses
- standardize success and error response contracts

4. I learned how to generate docs automatically from route annotations.
- use `swagger-jsdoc` to build the specification from code comments
- target route files via `apis` path configuration
- reduce manual doc drift by coupling docs to route implementation
- keep docs maintainable as endpoints evolve

5. I learned how to expose interactive API docs in Express.
- serve Swagger UI using `swagger-ui-express`
- publish raw spec JSON at `/api/v1/docs/swagger.json`
- expose interactive docs at `/api/v1/docs`
- handle redirect behavior for trailing slash compatibility

6. I learned documentation quality practices for team collaboration.
- write clear endpoint descriptions and expected status codes
- keep naming conventions consistent across schemas and routes
- document errors in a predictable format for frontend and QA teams
- treat API documentation as part of the deliverable, not an afterthought

## Key Technical Concepts I Practiced

- OpenAPI 3.0 specification design
- Swagger UI integration in Express
- `swagger-jsdoc` automated spec generation
- Bearer authentication documentation
- Reusable schema/component modeling
- Raw JSON spec exposure for tooling and integrations

## Summary

Day 13 helped me move from basic endpoint implementation to professional API documentation that is interactive, consistent, and maintainable for developers, testers, and stakeholders.
