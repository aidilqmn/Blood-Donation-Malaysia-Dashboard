function drawDonorTypeChart(data) {

  const container = d3.select("#chart2");
  const margin = { top: 20, right: 20, bottom: 40, left: 60 },
        width = 420 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("#tooltip");

  const keys = ["New", "Regular"];

  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(["#e74c3c", "#3498db"]); // red & blue

  // X scale for years
  const x0 = d3.scaleBand()
    .domain(data.map(d => d.year))
    .range([0, width])
    .padding(0.2);

  // X scale for New / Regular inside each year
  const x1 = d3.scaleBand()
    .domain(keys)
    .range([0, x0.bandwidth()])
    .padding(0.1);

  // Y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => Math.max(d.New, d.Regular))])
    .nice()
    .range([height, 0]);

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  // Y Axis
  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));

  // Groups per year
  const yearGroup = svg.selectAll(".year-group")
    .data(data)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${x0(d.year)},0)`);

  // Bars
  yearGroup.selectAll("rect")
    .data(d => keys.map(key => ({ key, value: d[key], year: d.year })))
    .enter()
    .append("rect")
    .attr("x", d => x1(d.key))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => height - y(d.value))
    .attr("fill", d => color(d.key))

    // Tooltip
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .html(`
          Year: ${d.year}<br>
          ${d.key} Donors: ${d3.format(",")(d.value)}
        `);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.clientX + 15) + "px")
        .style("top", (event.clientY - 15) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(10, -10)`);

    keys.forEach((key, i) => {
        const item = legend.append("g")
            .attr("transform", `translate(${i * 80}, 0)`); // spacing

        item.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(key));

        item.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .text(key)
            .attr("font-size", "12px");
    });

}
