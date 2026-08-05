function drawYearlyChart(data) {
  const container = d3.select("#yearlychart");
  const margin = { top: 20, right: 30, bottom: 50, left: 70 },
    width = 400 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("#tooltip");

  // 1. Scales
  const x = d3.scalePoint()
    .range([0, width])
    .domain(data.map(d => d.year))
    .padding(0.5);

  const yMax = d3.max(data, d => d.value) || 0;
  const y = d3.scaleLinear()
    .domain([0, yMax * 1.2]) // Extra padding at top for dots
    .range([height, 0]);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")));

  // 2. Area Generator
  const area = d3.area()
    .x(d => x(d.year))
    .y0(height) // Bottom boundary
    .y1(d => y(d.value)) // Top boundary (the data)
    .curve(d3.curveMonotoneX);

  // 3. Line Generator (for the top edge)
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  // 4. Draw the Fill (Area)
  svg.append("path")
    .datum(data)
    .attr("fill", "#c0392b")
    .attr("opacity", 0.2) // Subtle light red fill
    .attr("d", area);

  // 5. Draw the Top Line
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#c0392b")
    .attr("stroke-width", 3)
    .attr("d", line);

  // 6. Interactive Dots
  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.value))
    .attr("r", 5)
    .attr("fill", "#c0392b")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget).attr("r", 7);
      tooltip.style("opacity", 1)
        .html(`<b>${d.year}</b><br/>Donations: ${d3.format(",")(d.value)}`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.clientX + 15) + "px")
        .style("top", (event.clientY - 15) + "px");
    })
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).attr("r", 5);
      tooltip.style("opacity", 0);
    });
}