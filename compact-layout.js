let chart;

const COMPACT_PROFILE = {
  siblingMargin: 5,
  childrenMargin: 40,
  neighborMargin: 10,
  initialZoom: 0.85,
  cardPadding: "5px",
  cardBorder: "1px solid black",
  nameFontSize: 12,
  metaFontSize: 10,
  deathFontSize: 10,
  fontFamily: "'Times New Roman', Times, serif"
};

(async function renderCompactChart() {
  try {
    const treeData = await window.loadFamilyTreeData();
    chart = createCompactChart("#chart-container", treeData, COMPACT_PROFILE);
    
    // Global initializations from common library
    window.initPersonModal();
    window.bindChartControls(() => chart);
    
  } catch (err) {
    console.error("Error rendering compact chart:", err);
  }
})();

function createCompactChart(containerSelector, treeData, profile) {
  const chartInstance = new d3.OrgChart()
    .container(containerSelector)
    .data(treeData)
    .layout("top")
    .compact(false) // Disable compact to get proper horizontal spanning like the PDF
    .nodeWidth((node) => {
      if (node.depth === 0) return 260;
      if (node.depth === 1) return 140;
      return 75; // Thin vertical boxes for lower levels
    })
    .nodeHeight((node) => {
      if (node.depth === 0) return 100;
      if (node.depth === 1) return 120;
      return 180; // Tall boxes for lower levels to fit text
    })
    .childrenMargin(() => profile.childrenMargin)
    .siblingsMargin(() => profile.siblingMargin)
    .initialZoom(profile.initialZoom)
    .buttonContent(() => "") 
    .linkUpdate(function (d, i, arr) {
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    })
    .nodeContent((node) => {
      const person = node.data;
      
      const w = node.width;
      const h = node.height;
      
      // Calculate spouse text if any
      let spouseHtml = "";
      if (person.spouses && person.spouses.length > 0) {
        person.spouses.forEach((s, idx) => {
          spouseHtml += `<div style="font-size:${profile.metaFontSize}px; color:black; margin-top:4px;">
            Hôn phối: ${s.name}
          </div>`;
        });
      }

      const birthStr = person.birth_date ? `S: ${person.birth_date}` : "";
      const deathNote = window.getDeathNote(person.notes);
      const deathHtml = deathNote 
        ? `<div style="font-size: ${profile.deathFontSize}px; color: black; margin-top:2px;">M: ${deathNote}</div>` 
        : "";
        
      const titleStr = person.title ? `<div style="font-size: ${profile.metaFontSize}px; margin-bottom: 4px; font-weight: normal;">${person.title}</div>` : "";

      return `
        <div 
          onclick="event.stopPropagation(); window.showModalForId('${person.id}')"
          style="
          width: ${w}px; 
          height: ${h}px; 
          background: white; 
          border: ${profile.cardBorder}; 
          box-sizing: border-box;
          padding: ${profile.cardPadding};
          display: flex;
          flex-direction: column;
          font-family: ${profile.fontFamily};
          text-align: center;
          cursor: pointer;
          overflow: hidden;
        ">
          
          <!-- Title -->
          ${titleStr}

          <!-- Name -->
          <div style="font-weight: bold; font-size: ${profile.nameFontSize}px; color: black; line-height: 1.2; margin-bottom: 4px;">
            ${person.name.toUpperCase()}
          </div>

          <!-- Meta -->
          <div style="font-size: ${profile.metaFontSize}px; color: black;">
            ${birthStr}
          </div>
          ${deathHtml}

          <!-- Spouses -->
          ${spouseHtml}
        </div>
      `;
    });

  chartInstance.render().expandAll();
  return chartInstance;
}
