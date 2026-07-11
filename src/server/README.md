Cross-cutting server utilities that belong to no single feature:
session helper (getSession), org context resolution, rate limiting, logger
wiring. Feature logic never lives here — it lives in src/modules/<feature>.
