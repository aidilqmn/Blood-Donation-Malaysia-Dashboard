let RAW = [];
let GEO = null;

const ui = {
  year: "all",        // "all" or "2020"... "2025"
  state: "Malaysia"   // "Malaysia" or a state name from map
};

const tooltip = d3.select("#tooltip");

// ---------- Helpers ----------
const parseDate = d3.timeParse("%d/%m/%Y");


function normalizeStateName(name) {
  if (name === "W.P. Kuala Lumpur") return "Kuala Lumpur";
  if (name === "Pulau Pinang") return "Penang";
  return name;
}
const small_states = ["Kuala Lumpur", "Putrajaya", "Labuan"];

function setActiveYearButton(year) {
  d3.selectAll(".year-controls button")
    .classed("active", function () {
      return d3.select(this).attr("data-year") === year;
    });
}

// ---------- Main render ----------
function render() {
  // Filter 2020-2025 already done in RAW
  const yearNum = ui.year === "all" ? null : +ui.year;

  const filtered = RAW.filter(d => {
    const yearOk = yearNum === null ? true : d.year === yearNum;
    const stateOk = (ui.state === "Malaysia") ? (d.state === "Malaysia") : (d.state === ui.state);
    return yearOk && stateOk;
  });

  const dataMys = filtered.filter(d => d.state === "Malaysia");
  const dataState = RAW.filter(d => {
    // map uses state-level data (exclude "Malaysia")
    const yearOk = yearNum === null ? true : d.year === yearNum;
    return d.state !== "Malaysia" && yearOk;
  });

  
    const stateForCharts = ui.state; // "Malaysia" or selected state
    const sourceForYearly = RAW.filter(d => d.state === stateForCharts);

    const yearlyFiltered = (yearNum === null)
        ? sourceForYearly
        : sourceForYearly.filter(d => d.year === yearNum);

  const dataYearly = Array.from(d3.rollup(
    yearlyFiltered,
    v => d3.sum(v, d => d.daily),
    d => d.year
  ), ([year, value]) => ({ year, value })).sort((a, b) => a.year - b.year);

  // --- Chart 2: new vs regular (by year)
  const donorTypeData = Array.from(d3.rollup(
    yearlyFiltered,
    v => ({
      year: v[0].year,
      New: d3.sum(v, d => d.donations_new),
      Regular: d3.sum(v, d => d.donations_regular)
    }),
    d => d.year
  ), ([, v]) => v).sort((a, b) => a.year - b.year);

  // --- Chart 4: blood type 

  const bloodScope = filtered;

  const bloodTypeTotals = [
    { type: "A",  value: d3.sum(bloodScope, d => d.blood_a) },
    { type: "B",  value: d3.sum(bloodScope, d => d.blood_b) },
    { type: "O",  value: d3.sum(bloodScope, d => d.blood_o) },
    { type: "AB", value: d3.sum(bloodScope, d => d.blood_ab) }
  ];

  // Clear and redraw (simple + stable)
  d3.select("#yearlychart").selectAll("svg").remove();
  d3.select("#chart2").selectAll("svg").remove();
  d3.select("#donor_map").selectAll("svg").remove();
  d3.select("#chart4").selectAll("svg").remove();

  drawYearlyChart(dataYearly);

if (typeof drawDonorTypeChart === "function") {
  drawDonorTypeChart(donorTypeData);
} else {
  console.warn("drawDonorTypeChart is not defined. Check chart_donor.js");
}

if (typeof drawMap === "function") {
  drawMap(GEO, dataState, (clickedState) => {
    ui.state = clickedState;
    render();
  });
} else {
  console.warn("drawMap is not defined. Check donormap.js");
}

if (typeof drawBloodTypeChart === "function") {
  requestAnimationFrame(() => {
  drawBloodTypeChart(bloodTypeTotals);
});

} else {
  console.warn("drawBloodTypeChart is not defined. Check chart_blood.js");
}

    const displayState = (ui.state === "Malaysia") ? "All States" : ui.state;
    const displayYear = (ui.year === "all") ? "All" : ui.year;

    d3.select("#status").text(
    `Year: ${displayYear} | State: ${displayState}`
    );

    d3.select("#stateLabel").text(`Viewing: ${displayState}`);
}

// ---------- Setup interactions ----------
function setupYearButtons() {
  d3.selectAll(".year-controls button")
    .on("click", function () {
      const selectedYear = d3.select(this).attr("data-year");
      ui.year = selectedYear;
      setActiveYearButton(selectedYear);
      render();
    });
}

// ---------- Load ----------
Promise.all([
  d3.csv("donations_state.csv"),
  d3.json("my.json")
]).then(([rawData, geoData]) => {
  GEO = geoData;

  rawData.forEach(d => {
    d.date = parseDate(d.date);
    d.year = d.date.getFullYear();

    d.state = normalizeStateName(d.state);

    d.daily = +d.daily;
    d.donations_new = +d.donations_new;
    d.donations_regular = +d.donations_regular;
    d.blood_a = +d.blood_a;
    d.blood_b = +d.blood_b;
    d.blood_o = +d.blood_o;
    d.blood_ab = +d.blood_ab;
  });

  // Keep only 2020-2025 in memory (your scope)
  RAW = rawData.filter(d => d.year >= 2020 && d.year <= 2025);

  setupYearButtons();
  setActiveYearButton("all");
  d3.select("#resetState").classed("active", true);

  d3.select("#resetState").on("click", () => {
   ui.state = "Malaysia";
   d3.select("#resetState").classed("active", true);
   render();
   });


  render();
    function debounce(fn, delay = 200) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), delay);
        };
    }

    window.addEventListener("resize", debounce(() => {
        render(); // redraw charts + map with new container width
    }, 200));

});
