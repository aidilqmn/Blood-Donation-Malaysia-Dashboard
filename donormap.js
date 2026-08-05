function drawMap(geoData, dataState, onStateClick) {
  const container = d3.select("#donor_map");
  container.selectAll("svg").remove();

  const rect = container.node().getBoundingClientRect();
  const width = rect.width;
  const height = 450;

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%");

  // --- 1. Data Processing ---
  const totalsByState = d3.rollup(
    dataState,
    v => d3.sum(v, d => d.daily),
    d => d.state
  );

  // Grouping logic for WP (Wilayah Persekutuan)
  const ftNames = ["Kuala Lumpur", "Putrajaya", "Labuan"];
  const ftTotal = ftNames.reduce((acc, name) => acc + (totalsByState.get(name) || 0), 0);
  
  const maxVal = d3.max(Array.from(totalsByState.values())) || 0;
  const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, maxVal]);
  const tooltip = d3.select("#tooltip");

  // Helper to handle the "WP" naming convention
  const getDisplayInfo = (name) => {
    if (ftNames.includes(name)) {
      return { 
        displayName: "W. Persekutuan", // This is what the user sees
        dataKey: "Kuala Lumpur",      // This is the key used to filter your data
        value: ftTotal 
      };
    }
    return { 
      displayName: name, 
      dataKey: name, 
      value: totalsByState.get(name) || 0 
    };
  };

  // --- 2. Main Map Projection ---
  const projection = d3.geoMercator().fitSize([width, height], geoData);
  const path = d3.geoPath().projection(projection);

  svg.selectAll(".main-path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("class", "main-path")
    .attr("d", path)
    .attr("fill", d => colorScale(getDisplayInfo(d.properties.name).value))
    .attr("stroke", "#444")
    .attr("stroke-width", 0.5)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("stroke-width", 1.5).raise();
      const info = getDisplayInfo(d.properties.name);
      tooltip.style("opacity", 1)
        .html(`<b>${info.displayName}</b>: ${d3.format(",")(info.value)}`);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.clientX + 15) + "px")
        .style("top", (event.clientY - 15) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("stroke-width", 0.5);
      tooltip.style("opacity", 0);
    })
    .on("click", (event, d) => {
      const info = getDisplayInfo(d.properties.name);
      // We send the displayName ("W. Persekutuan") to the dashboard label
      // but the dashboard logic must be aware that "W. Persekutuan" = "Kuala Lumpur" data.
      if (onStateClick) onStateClick(info.displayName); 
    });

  // --- 3. Zoom Panel ---
  const panelWidth = 280; 
  const panelHeight = 100;
  const zoomGroup = svg.append("g")
    .attr("transform", `translate(${(width - panelWidth) / 2}, 20)`);

  zoomGroup.append("rect")
    .attr("width", panelWidth).attr("height", panelHeight)
    .attr("fill", "rgba(255,255,255,0.98)").attr("stroke", "#666").attr("rx", 8);

  zoomGroup.append("text")
    .attr("x", panelWidth / 2).attr("y", 15).attr("text-anchor", "middle")
    .attr("font-size", "11px").attr("font-weight", "bold").text("Federal Territories (Zoomed)");

  function drawInset(nameArray, xOffset, label, boxWidth) {
    const insetG = zoomGroup.append("g").attr("transform", `translate(${xOffset}, 20)`);
    insetG.append("text")
      .attr("x", boxWidth / 2).attr("y", 10).attr("text-anchor", "middle")
      .attr("font-size", "9px").attr("fill", "#666").text(label);

    const features = geoData.features.filter(d => nameArray.includes(d.properties.name));
    const insetProj = d3.geoMercator()
        .fitExtent([[10, 15], [boxWidth - 10, panelHeight - 30]], { type: "FeatureCollection", features });

    const insetPath = d3.geoPath().projection(insetProj);

    insetG.selectAll(".inset-path")
      .data(features)
      .enter()
      .append("path")
      .attr("d", insetPath)
      .attr("fill", colorScale(ftTotal))
      .attr("stroke", "#000")
      .style("cursor", "pointer")
      .on("mouseover", () => {
        tooltip.style("opacity", 1).html(`<b>W. Persekutuan</b>: ${d3.format(",")(ftTotal)}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.clientX + 15) + "px").style("top", (event.clientY - 15) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0))
      .on("click", () => onStateClick && onStateClick("Kuala Lumpur"));
  }

  drawInset(["Kuala Lumpur", "Putrajaya"], 0, "West Malaysia", panelWidth / 2);
  drawInset(["Labuan"], panelWidth / 2, "East Malaysia", panelWidth / 2);

  // --- 4. Legend ---
  const legendWidth = 140;
  const legendX = 20;
  const legendY = height - 40;
  const legendScale = d3.scaleLinear().domain([0, maxVal]).range([0, legendWidth]);
  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient").attr("id", "map-grad");
  gradient.selectAll("stop").data([0, 0.5, 1]).enter().append("stop")
    .attr("offset", d => `${d * 100}%`).attr("stop-color", d => colorScale(d * maxVal));

  const legG = svg.append("g").attr("transform", `translate(${legendX}, ${legendY})`);
  legG.append("rect").attr("width", legendWidth).attr("height", 8).style("fill", "url(#map-grad)");
  legG.append("g").attr("transform", "translate(0,8)").call(d3.axisBottom(legendScale).ticks(2).tickFormat(d3.format(".2s"))).select(".domain").remove();
}