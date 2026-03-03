/* ================= GLOBAL ================= */

let expenses = [];
let currentUser = null;

let pieChartInstance = null;
let monthlyChartInstance = null;
let lineChartInstance = null;


/* ================= PAGE SWITCH ================= */

function showPage(id) {

document.querySelectorAll(".page")
.forEach(p => p.classList.remove("active"));

document.getElementById(id).classList.add("active");

if (id === "reports") {
    setTimeout(renderCharts, 200);
}
}


/* ================= LOGIN ================= */

function login() {

const user = document.getElementById("username").value.trim();
const pass = document.getElementById("password").value.trim();

if (!user || !pass) {
    // loginMsg.innerText = "Enter credentials";
    document.getElementById("loginMsg").innerText =
"Enter credentials";
    return;
}

const saved = localStorage.getItem("pass_" + user);

if (!saved) {
    localStorage.setItem("pass_" + user, pass);
} else if (saved !== pass) {
    // loginMsg.innerText = "Wrong password";
    document.getElementById("loginMsg").innerText =
"Wrong password";
    return;
}

currentUser = user;
userDisplay.innerText = "👤 " + user;

loadExpenses();
showPage("dashboard");
}


/* ================= LOGOUT ================= */

function logout() {
location.reload();
}


/* ================= STORAGE KEY ================= */

function getKey() {
const sheet = document.getElementById("sheet").value;
return "expenses_" + currentUser + "_" + sheet;
}


/* ================= SAVE / LOAD ================= */

function saveExpenses() {
localStorage.setItem(getKey(), JSON.stringify(expenses));
}

function loadExpenses() {
expenses = JSON.parse(localStorage.getItem(getKey())) || [];
renderExpenses();
updateDashboard();
}


/* ================= ADD EXPENSE ================= */

document.getElementById("expense-form")
.addEventListener("submit", function(e){

e.preventDefault();

let typeValue = document.getElementById("type").value;
const customType = document.getElementById("custom-type").value.trim();

if (customType !== "") {
    typeValue = customType;
}

const expense = {
    type: typeValue,
    date: document.getElementById("date").value,
    amount: Number(document.getElementById("amount").value)
};

expenses.push(expense);

saveExpenses();
renderExpenses();
updateDashboard();

this.reset();
});


/* ================= TABLE ================= */

function renderExpenses(){

const table = document.getElementById("expenseTable");
table.innerHTML = "";

expenses.forEach((e, i) => {

table.innerHTML += `
<tr>
<td>${e.type}</td>
<td>${e.date}</td>
<td>₹${e.amount}</td>
<td>
<button class="edit" onclick="editExpense(${i})">Edit</button>
<button class="delete" onclick="deleteExpense(${i})">Delete</button>
</td>
</tr>
`;
});
}


/* ================= DELETE ================= */

function deleteExpense(i){
expenses.splice(i,1);
saveExpenses();
renderExpenses();
updateDashboard();
}


/* ================= EDIT ================= */

function editExpense(i){

const e = expenses[i];

document.getElementById("type").value = e.type;
document.getElementById("date").value = e.date;
document.getElementById("amount").value = e.amount;

expenses.splice(i,1);
saveExpenses();
renderExpenses();
updateDashboard();
}


/* ================= DASHBOARD ================= */

function updateDashboard(){

const total = expenses.reduce((s,e)=>s+e.amount,0);

document.getElementById("total").innerText = total;

const budget =
localStorage.getItem("budget_"+currentUser) || 0;

document.getElementById("remaining").innerText =
budget - total;

updateAI(total);
}


/* ================= BUDGET ================= */

function setBudget(){
localStorage.setItem(
"budget_"+currentUser,
document.getElementById("budgetInput").value
);

updateDashboard();
}


/* ================= AI INSIGHT ================= */

function updateAI(total){

const el = document.getElementById("aiInsight");

if(total === 0)
el.innerText = "No spending yet.";

else if(total < 5000)
el.innerText = "✅ Spending healthy.";

else if(total < 15000)
el.innerText = "⚠ Moderate spending.";

else
el.innerText = "🚨 High spending detected.";
}


/* ================= CHARTS ================= */

function renderCharts(){

const cat = {};
const month = {};

expenses.forEach(e=>{
cat[e.type]=(cat[e.type]||0)+e.amount;

const m=e.date.slice(0,7);
month[m]=(month[m]||0)+e.amount;
});


/* PIE */
const pieCtx = document.getElementById("pieChart").getContext("2d");

if(pieChartInstance) pieChartInstance.destroy();

pieChartInstance = new Chart(pieCtx,{
type:"pie",
data:{
labels:Object.keys(cat),
datasets:[{data:Object.values(cat)}]
}
});


/* BAR */
const barCtx = document.getElementById("monthlyChart").getContext("2d");

if(monthlyChartInstance) monthlyChartInstance.destroy();

monthlyChartInstance = new Chart(barCtx,{
type:"bar",
data:{
labels:Object.keys(month),
datasets:[{label:"Monthly Spend",data:Object.values(month)}]
}
});


/* LINE */
const lineCtx = document.getElementById("lineChart").getContext("2d");

if(lineChartInstance) lineChartInstance.destroy();

lineChartInstance = new Chart(lineCtx,{
type:"line",
data:{
labels:Object.keys(cat),
datasets:[{
label:"Expense Trend",
data:Object.values(cat),
tension:0.4
}]
}
});
}


/* ================= SHEET SWITCH ================= */

document.getElementById("sheet")
.addEventListener("change", loadExpenses);
/* ===============================
   EXPORT DATA FEATURE
================================ */
function getAllExpenses() {

    let all = [];

    ["personal","office","family"].forEach(sheet => {

        const key = "expenses_" + currentUser + "_" + sheet;
        const data = JSON.parse(localStorage.getItem(key)) || [];

        all = all.concat(data);
    });

    return all;
}
/* ---------- CSV EXPORT ---------- */
document.getElementById("exportCSV")?.addEventListener("click", () => {

    const data = getAllExpenses();

    if (data.length === 0) {
        alert("No expense data available!");
        return;
    }

    let csv =
        "Date,Title,Category,Subcategory,Amount\n";

    data.forEach(exp => {
        // csv += `${exp.date},${exp.title},${exp.category},${exp.subcategory},${exp.amount}\n`;
        csv += `${exp.date},${exp.type},,${exp.amount}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
});

/* ---------- JSON EXPORT ---------- */
document.getElementById("exportJSON")?.addEventListener("click", () => {

    const data = getAllExpenses();

    if (data.length === 0) {
        alert("No expense data available!");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.json";
    a.click();
});
const ctx = document.getElementById('expenseChart');

new Chart(ctx,{
  type: 'doughnut',
  data: {
    labels: ['Food','Bills','Shopping','Travel'],
    datasets: [{
      data: [300, 250, 200, 300],
      borderWidth: 0
    }]
  },
  options: {
    plugins: {
      legend: {
        labels: { color: 'white' }
      }
    }
  }
});
