function setupYearButtons(geoData) {
    d3.selectAll(".year-controls button")
        .on("click", function () {

            // Update active button
            d3.selectAll(".year-controls button").classed("active", false);
            d3.select(this).classed("active", true);

            const selectedYear = d3.select(this).attr("data-year");

            let filteredData;

            if (selectedYear === "all") {
                filteredData = globalStateData;
            } else {
                filteredData = globalStateData.filter(
                    d => d.year === +selectedYear
                );
            }

            // Clear old map
            d3.select("#donor_map").select("svg").remove();

            // Redraw map with filtered data
            drawMap(geoData, filteredData);
        });
}
