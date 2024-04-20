const inquirer = require("inquirer");
const mysql = require("mysql2/promise");

const db = mysql.createConnection(
  {
    host: "localhost",
    user: "root",
    password: 'Your SQL Password',
    database: "employee_tracker",
  },
  console.log("Connected to the database")
);

const questions = [
  {
    type: "list",
    name: "options",
    message: "What would you like to do?",
    choices: [
      "View All Employees",
      "Add Employee",
      "Update Employee Role",
      "View All Roles",
      "Add Role",
      "View All Departments",
      "Add Department",
      "Quit",
    ],
  },
];

// Views all the departments
function viewAllDepartments() {
  let department = `SELECT departments.id, departments.department_name FROM departments
                    ORDER BY departments.id`;
  db.then((conn) => conn.query(department))
    .then(([rows, fields]) => {
      console.table(rows);

      init();
    })
    .catch((err) => {
      console.error(err);
    });
}

// Views all the roles
function viewAllRoles() {
  let roles = `SELECT roles.id, roles.title, departments.department_name AS departments, roles.salary FROM roles
               JOIN departments ON roles.department_id = departments.id
               ORDER BY roles.id`;
  db.then((conn) => conn.query(roles))
    .then(([rows, fields]) => {
      console.table(rows);

      init();
    })
    .catch((err) => {
      console.error(err);
    });
}

// Views all the employees
function viewEmployees() {
  let employees = `SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.department_name AS departments, roles.salary, CONCAT(manager.first_name, " ", manager.last_name) AS manager
                   FROM employees
                   LEFT JOIN employees AS manager ON employees.manager_id = manager.id
                   JOIN roles ON employees.role_id = roles.id
                   JOIN departments ON roles.department_id = departments.id
                   ORDER BY employees.id`;
  db.then((conn) => conn.query(employees))
    .then(([rows, fields]) => {
      console.table(rows);
      console.log(" ");

      init();
    })
    .catch((err) => {
      console.error(err);
    });
}

// Adds employee and gives the choice to give them a manager or not
async function addEmployee() {
  let role = `SELECT roles.title FROM roles`;
  let roles = await db
    .then((conn) => conn.query(role))
    .then(([rows, fields]) => {
      let choice = rows.map((row) => row.title);

      return choice;
    })
    .catch((err) => {
      console.error(err);
    });

  let employee = `SELECT CONCAT(employees.first_name, " ", employees.last_name) AS employee FROM employees`;
  let managers = await db
    .then((conn) =>
      conn.query(employee)
    )
    .then(([rows, fields]) => {
      let choice = rows.map((row) => row.employee);

      choice.push("None");

      return choice;
    })
    .catch((err) => {
      console.error(err);
    });

  inquirer
    .prompt([
      {
        type: "input",
        name: "employeeFirstName",
        message: "What is the employee's first name?",
        validate: (name) => {
          let trimmedName = name.trim();
          if (trimmedName == "" || /\s/.test(trimmedName)) {
            return "Enter a proper name.";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "employeeLastName",
        message: "What is the employee's last name?",
        validate: (name) => {
          let trimmedName = name.trim();
          if (trimmedName == "" || /\s/.test(trimmedName)) {
            return "Enter a proper name.";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "employeeRole",
        message: "What is the employee's role?",
        choices: roles,
      },
      {
        type: "list",
        name: "employeeManager",
        message: "What is the employee's manager?",
        choices: managers,
      },
    ])
    .then((responses) => {
      let roleIndex = roles.indexOf(responses.employeeRole) + 1;
      let managerIndex = managers.indexOf(responses.employeeManager) + 1;

      let trimmedFirstName = responses.employeeFirstName.trim();
      let trimmedLastName = responses.employeeLastName.trim();
 
      if (responses.employeeManager !== "None") {
        let employee = `INSERT INTO employees (first_name, last_name, role_id, manager_id)
                     VALUES ("${trimmedFirstName}", "${trimmedLastName}", ${roleIndex}, ${managerIndex})`;
        db.then((conn) =>
          conn.query(employee)
        ).catch((err) => console.error(err));
        
        console.log(`Added ${trimmedFirstName} ${trimmedLastName} to the database`);

        init();
      } else {
      let employeeManager = `INSERT INTO employees (first_name, last_name, role_id, manager_id)
                      VALUES ("${trimmedFirstName}", "${trimmedLastName}", ${roleIndex}, NULL)`
      db.then((conn) =>
        conn.query(employeeManager)
      ).catch((err) => console.error(err));
      
      console.log(`Added ${trimmedFirstName} ${trimmedLastName} to the database`);

      init();
        }
    });
}

// Adds a department
async function addDepartment() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "departmentName",
        message: "What is the name of the department?",
        validate: (name) => {
          let trimmedName = name.trim();
          if (trimmedName == "" || /\s/.test(trimmedName)) {
            return "Enter a proper name.";
          }
          return true;
        },
      },
    ])
    .then((responses) => {
      let department = `INSERT INTO departments (department_name) VALUES ("${responses.departmentName}")`
      db.then((conn) =>
        conn.query(department)
      );
      console.log(`Added ${responses.departmentName} to the database`)
      init();
    })
    .catch((err) => console.error(err));
}

// Adds a role
async function addRole() {
  let department = `SELECT department_name FROM departments`;
  const departments = await db
    .then((conn) => conn.query(department))
    .then(([rows, fields]) => {
      let choices = rows.map((row) => row.department_name);

      return choices;
    });

  inquirer
    .prompt([
      {
        type: "input",
        name: "roleName",
        message: "What is the name of this role?",
        validate: (name) => {
          let trimmedName = name.trim();
          if (trimmedName == "") {
            return "Enter a proper name.";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "roleSalary",
        message: "What is the salary of this role?",
        validate: (salary) => {
          let salaryNum = Number(salary);
          if (salaryNum <= 0 || /\s/.test(salaryNum)) {
            return "Enter a proper number.";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "roleDepartment",
        message: "What department does this role belong to?",
        choices: departments,
      },
    ])
    .then((responses) => {
      let departmentIndex = departments.indexOf(responses.roleDepartment) + 1;
      let role = `INSERT INTO roles (title, salary, department_id)
                   VALUES ("${responses.roleName}", ${responses.roleSalary}, ${departmentIndex})`;
      db.then((conn) =>
        conn.query(role)
      );
      console.log(`Added ${responses.roleName} to the database`)
      init();
    })
    .catch((err) => console.error(err));
}

// Selects an employee and updates their role
async function updateEmployeeRole() {
  let employee = `SELECT CONCAT(employees.first_name, " ", employees.last_name)
               AS employee FROM employees`;
  const employees = await db
    .then((conn) =>
      conn.query(employee)
    )
    .then(([rows, fields]) => {
      let choices = rows.map((row) => row.employee);

      return choices;
    });
  
  let role = `SELECT roles.title FROM roles`;
  const roles = await db
    .then((conn) => conn.query(role))
    .then(([rows, fields]) => {
      let choices = rows.map((row) => row.title);

      return choices;
    });
  inquirer
    .prompt([
      {
        type: "list",
        name: "employeeRole",
        message: "Which employee's role do you want to update?",
        choices: employees,
      },
      {
        type: "list",
        name: "updatedRole",
        message: "Which role do you want to assign the selected employee?",
        choices: roles,
      },
    ])
    .then((responses) => {
      const rolesIndex = roles.indexOf(responses.updatedRole) + 1;
      const employeesIndex = employees.indexOf(responses.employeeRole) + 1;
      let roleId = `UPDATE employees SET role_id=${rolesIndex}
                   WHERE id = ${employeesIndex}`
      db.then((conn) =>
        conn.query(roleId)
      );

      console.log("Updated employee's role");

      init();
    })
    .catch((err) => {
      console.error(err);
    });
}

// This is the choice system for inquirer
function getResponse(data) {
  switch (data.options) {
    case "View All Employees":
      viewEmployees();
      break;
    case "Quit":
      process.exit();
    case "View All Departments":
      viewAllDepartments();
      break;
    case "View All Roles":
      viewAllRoles();
      break;
    case "Add Employee":
      addEmployee();
      break;
    case "Add Department":
      addDepartment();
      break;
    case "Add Role":
      addRole();
      break;
    case "Update Employee Role":
      updateEmployeeRole();
      break;
    default:
      return "";
  }
}

const init = () => {
    inquirer.prompt(questions).then((responses) => {
      getResponse(responses);
    });
}

init();