let outputDiv = document.getElementsByClassName("bill-details-output");
let submitButton = document.getElementById("calculate-submit");
let ampere = document.getElementById("ampere-selector");
let unitsInput = document.getElementById("units");
let neaForm = document.getElementById("nea-bill");
let tbody = document.getElementById("bill-details-body");
let minChargeAmount = document.getElementById("min-energy-charge");
let unitsBillDetails = {};

let output = false;

let fetchBillData = async function () {
  try {
    const response = await fetch("./json/billAmount.json");
    const data = await response.json();
    return data["tariffs"];
  } catch (error) {
    console.log(error);
    return null;
  }
};

fetchBillData().then((data) => (unitsBillDetails = data));

let toggleSubmitButton = function () {
  if (unitsInput.value >= 0 && unitsInput.value != "") {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
};

unitsInput.addEventListener("input", function (event) {
  toggleSubmitButton();
  output = false;
  toggleBillDetailsOutput();
});

neaForm.addEventListener("submit", function (event) {
  event.preventDefault();
  results = calculateBillAmount(
    unitsBillDetails[`ampere_${ampere.value}`],
    ampere.value,
    unitsInput.value
  );
  output = true;
  toggleBillDetailsOutput();
  populateResults(results[0], results[1]);
});

function calculateBillAmount(pricing, ampere, units) {
  let tableOutput = [];
  if (ampere == 5 && units <= 20) {
    tableOutput.push({
      bracket: `${pricing["ranges"][0]["range"][0]}-${pricing["ranges"][0]["range"][1]}`,
      perUnitCost: 0,
      cumulative: pricing["ranges"][0]["range"][0],
    });
    tableOutput.push({
      bracket: "total amount",
      perUnitCost: null,
      cumulative: pricing["ranges"][0]["minimum_charge"],
    });
    return [tableOutput, pricing["ranges"][0]["minimum_charge"]];
  } else {
    let minimumCharge = 0;
    let count = 0;
    let unitsCharge = 0;
    for (let item of pricing["ranges"]) {
      if (item["range"][1] === null) {
        item["range"][1] = Infinity;
      }
      if (units >= item["range"][0]) {
        minimumCharge = item["minimum_charge"];
        if (units <= item["range"][1]) {
          item["range"][1] = units;
        }
        if (count < 1) {
          unitsCharge +=
            item["per_unit_cost"] * (item["range"][1] - item["range"][0]);
        } else {
          unitsCharge +=
            item["per_unit_cost"] * (item["range"][1] - item["range"][0] + 1);
        }
        count += 1;
        tableOutput.push({
          bracket: `${item["range"][0]}-${item["range"][1]}`,
          perUnitCost: item["per_unit_cost"],
          cumulative: unitsCharge,
        });
      }
    }
    tableOutput.push({
      bracket: "total amount",
      perUnitCost: null,
      cumulative: minimumCharge + unitsCharge,
    });
    return [tableOutput, minimumCharge];
  }
}

function populateResults(tableOutput, minimumCharge) {
  tbody.innerHTML = "";
  tableOutput.forEach(function (item) {
    let tr = document.createElement("tr");
    let perUnitCost = item.perUnitCost !== null ? item.perUnitCost : "";
    tr.innerHTML =
      "<td class='text-start'>" +
      item.bracket +
      "</td><td class='text-start'>" +
      perUnitCost +
      "</td><td class='text-start'>" +
      item.cumulative +
      "</td>";
    tbody.appendChild(tr);
  });
  minChargeAmount.innerHTML = minimumCharge;
}

function toggleBillDetailsOutput() {
  const billDetailsOutput = document.querySelector(".bill-details-output");
  billDetailsOutput.style.display = output ? "block" : "none";
}
