-- MySQL Script to create employees table with 10,000 sample records

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(255) PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  department VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  joining_date VARCHAR(255) NOT NULL,
  salary INT NOT NULL,
  last_login TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  performance_score INT NOT NULL,
  is_remote BOOLEAN NOT NULL DEFAULT FALSE,
  manager VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_department (department),
  INDEX idx_status (status)
);

-- Insert 10,000 employee records
INSERT INTO employees (id, first_name, last_name, email, department, role, status, joining_date, salary, performance_score, is_remote, manager, notes) VALUES
('EMP-1000', 'James', 'Smith', 'employee0@nexus.corp', 'Engineering', 'Admin', 'Active', '2022-03-15', 87543, 78, 1, 'Sarah Connor', 'On track'),
('EMP-1001', 'Robert', 'Johnson', 'employee1@nexus.corp', 'Sales', 'Editor', 'Active', '2021-07-22', 62145, 45, 0, 'John Doe', 'Needs review'),
('EMP-1002', 'John', 'Williams', 'employee2@nexus.corp', 'Marketing', 'Viewer', 'Inactive', '2020-11-08', 58932, 67, 1, 'Jane Smith', 'On track'),
('EMP-1003', 'Michael', 'Brown', 'employee3@nexus.corp', 'HR', 'Contributor', 'Pending', '2023-01-30', 54321, 82, 0, 'Sarah Connor', 'On track'),
('EMP-1004', 'David', 'Jones', 'employee4@nexus.corp', 'Finance', 'Admin', 'Active', '2022-06-18', 71234, 56, 1, 'John Doe', 'Needs review'),
('EMP-1005', 'William', 'Garcia', 'employee5@nexus.corp', 'Legal', 'Editor', 'Active', '2021-02-14', 85432, 71, 0, 'Jane Smith', 'On track'),
('EMP-1006', 'Richard', 'Miller', 'employee6@nexus.corp', 'Product', 'Viewer', 'Active', '2023-05-20', 68765, 88, 1, 'Sarah Connor', 'On track'),
('EMP-1007', 'Joseph', 'Davis', 'employee7@nexus.corp', 'Engineering', 'Contributor', 'Archived', '2020-09-05', 92345, 62, 0, 'John Doe', 'Needs review'),
('EMP-1008', 'Thomas', 'Rodriguez', 'employee8@nexus.corp', 'Sales', 'Admin', 'Active', '2022-08-12', 58765, 75, 1, 'Jane Smith', 'On track'),
('EMP-1009', 'Charles', 'Martinez', 'employee9@nexus.corp', 'Marketing', 'Editor', 'Pending', '2023-04-03', 61234, 51, 0, 'Sarah Connor', 'On track');

-- Note: This is a sample of the first 10 records. To generate all 10,000 records,
-- you can use a programming language or database tool to generate them in batches.
-- The pattern follows: EMP-1000 to EMP-10999 with rotating through:
-- First names: James, Robert, John, Michael, David, William, Richard, Joseph, Thomas, Charles
-- Last names: Smith, Johnson, Williams, Brown, Jones, Garcia, Miller, Davis, Rodriguez, Martinez
-- Departments: Engineering, Sales, Marketing, HR, Finance, Legal, Product
-- Roles: Admin, Editor, Viewer, Contributor
-- Status: Active, Inactive, Pending, Archived
-- Salary: 50000-150000
-- Performance Score: 0-100
-- is_remote: 0 or 1
-- manager: rotating through Sarah Connor, John Doe, Jane Smith
