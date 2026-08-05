function drawBloodTypeChart(data) {

    const container = d3.select("#chart4");
    const rect = container.node().getBoundingClientRect();

    let width = rect.width;
    let height = rect.height;

    if (!height || height < 200) height = 280;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%");

    const tooltip = d3.select("#tooltip");

    const total = d3.sum(data, d => d.value);

    // Convert to hierarchy
    const root = d3.hierarchy({ children: data })
        .sum(d => d.value);

    d3.treemap()
        .size([width, height])
        .padding(4)
        (root);

    const color = d3.scaleOrdinal()
        .domain(["O", "A", "B", "AB"])
        .range([
            "#c0392b",
            "#3498db",
            "#2ecc71",
            "#f1c40f"
        ]);

    svg.selectAll("rect")
        .data(root.leaves())
        .enter()
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => color(d.data.type))
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`
                Blood Type ${d.data.type}<br>
                ${d3.format(",")(d.data.value)} 
                (${((d.data.value / total) * 100).toFixed(1)}%)
`);

        })
        .on("mousemove", (event) => {
            tooltip
                .style("left", (event.clientX + 15) + "px")
                .style("top", (event.clientY - 15) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    // Labels
    svg.selectAll("text")
        .data(root.leaves())
        .enter()
        .append("text")
        .attr("x", d => d.x0 + 5)
        .attr("y", d => d.y0 + 18)
        .text(d => d.data.type)
        .attr("fill", "#fff")
        .attr("font-size", "14px")
        .style("pointer-events", "none");
}
