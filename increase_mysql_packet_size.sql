-- Run this SQL command to increase MySQL packet size globally
-- This allows fetching large result sets (10,000+ rows)

SET GLOBAL max_allowed_packet=67108864; -- 64MB

-- Verify the change
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Note: This change is temporary and will reset on MySQL restart
-- To make it permanent, add this to your MySQL config file (my.ini on Windows):
-- [mysqld]
-- max_allowed_packet=64M
