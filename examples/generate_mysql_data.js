#!/usr/bin/env node

// Script to generate 10,000 employee records as MySQL INSERT statements
// Usage: node generate_mysql_data.js > employee_data_full.sql

const fs = require('fs');

const FIRST_NAMES = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Legal', 'Product'];
const ROLES = ['Admin', 'Editor', 'Viewer', 'Contributor'];
const STATUSES = ['Active', 'Inactive', 'Pending', 'Archived'];
const MANAGERS = ['Sarah Connor', 'John Doe', 'Jane Smith'];

function randomDate(startYear = 2020, endYear = 2023) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateSQL() {
  console.log('-- MySQL Script: 10,000 Employee Records');
  console.log('-- Generated on:', new Date().toISOString());
  console.log();
  
  console.log('CREATE TABLE IF NOT EXISTS employees (');
  console.log('  id VARCHAR(255) PRIMARY KEY,');
  console.log('  first_name VARCHAR(255) NOT NULL,');
  console.log('  last_name VARCHAR(255) NOT NULL,');
  console.log('  email VARCHAR(255) NOT NULL UNIQUE,');
  console.log('  department VARCHAR(255) NOT NULL,');
  console.log('  role VARCHAR(255) NOT NULL,');
  console.log('  status VARCHAR(255) NOT NULL,');
  console.log('  joining_date VARCHAR(255) NOT NULL,');
  console.log('  salary INT NOT NULL,');
  console.log('  last_login TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,');
  console.log('  performance_score INT NOT NULL,');
  console.log('  is_remote BOOLEAN NOT NULL DEFAULT FALSE,');
  console.log('  manager VARCHAR(255),');
  console.log('  notes TEXT,');
  console.log('  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,');
  console.log('  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,');
  console.log('  INDEX idx_email (email),');
  console.log('  INDEX idx_department (department),');
  console.log('  INDEX idx_status (status)');
  console.log(');');
  console.log();
  
  // Generate inserts in batches for better performance
  const BATCH_SIZE = 100;
  let batch = [];
  
  for (let i = 0; i < 10000; i++) {
    const id = `EMP-${1000 + i}`;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const email = `employee${i}@nexus.corp`;
    const department = DEPARTMENTS[i % DEPARTMENTS.length];
    const role = ROLES[i % ROLES.length];
    const status = STATUSES[i % STATUSES.length];
    const joiningDate = randomDate(2020, 2023);
    const salary = 50000 + Math.floor(Math.random() * 100000);
    const performanceScore = Math.floor(Math.random() * 100);
    const isRemote = Math.random() > 0.5 ? 1 : 0;
    const manager = MANAGERS[i % MANAGERS.length];
    const notes = i % 5 === 0 ? 'Needs review' : 'On track';
    
    const values = `('${id}', '${firstName}', '${lastName}', '${email}', '${department}', '${role}', '${status}', '${joiningDate}', ${salary}, NOW(), ${performanceScore}, ${isRemote}, '${manager}', '${notes}')`;
    batch.push(values);
    
    // Output batch when it reaches BATCH_SIZE
    if (batch.length === BATCH_SIZE || i === 9999) {
      console.log(`INSERT INTO employees (id, first_name, last_name, email, department, role, status, joining_date, salary, last_login, performance_score, is_remote, manager, notes) VALUES`);
      console.log(batch.join(',\n'));
      console.log(';');
      console.log();
      batch = [];
    }
  }
}

generateSQL();
