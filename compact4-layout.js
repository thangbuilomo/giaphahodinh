let chart;

const COMPACT_PROFILE = {
  siblingMargin: 2,
  childrenMargin: 30,
  neighbourMargin: 2,
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
    let treeData = await window.loadFamilyTreeData();
    
    // Group simple siblings at depth >= 3
    const idMap = new Map();
    treeData.forEach(d => { idMap.set(d.id, d); d.myDepth = 0; d.stackedSiblings = []; });
    
    let changed = true;
    while(changed) {
        changed = false;
        treeData.forEach(d => {
            if (d.parentId && idMap.has(d.parentId)) {
                let p = idMap.get(d.parentId);
                if (d.myDepth !== p.myDepth + 1) {
                    d.myDepth = p.myDepth + 1;
                    changed = true;
                }
            }
        });
    }

    const childrenMap = new Map();
    treeData.forEach(d => {
        if (!childrenMap.has(d.parentId)) childrenMap.set(d.parentId, []);
        childrenMap.get(d.parentId).push(d);
    });

    const isSimple = (d) => {
        return (!d.spouses || d.spouses.length === 0) && (!childrenMap.has(d.id) || childrenMap.get(d.id).length === 0);
    };

    const toRemove = new Set();
    childrenMap.forEach((children, parentId) => {
        if (children.length > 0 && children[0].myDepth >= 3) {
            const simpleChildren = children.filter(c => isSimple(c));
            if (simpleChildren.length > 1) {
                const primary = simpleChildren[0];
                for (let i = 1; i < simpleChildren.length; i++) {
                    primary.stackedSiblings.push(simpleChildren[i]);
                    toRemove.add(simpleChildren[i].id);
                }
            }
        }
    });

    const visibleData = treeData.filter(d => !toRemove.has(d.id));
    chart = createCompactChart("#chart-container", visibleData, COMPACT_PROFILE);
    
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
    .compact(true) 
    .compactMarginBetween((d) => 5)
    .compactMarginPair((d) => 5)
    .nodeWidth((node) => {
      let base = 75; 
      if (node.depth === 0) base = 120;
      if (node.depth === 1) base = 95;
      if (node.depth >= 3) base = 55;
      return base;
    })
    .nodeHeight((node) => {
      let h = 100; 
      if (node.depth === 0) h = 140;
      if (node.depth === 1) h = 120;
      if (node.depth === 2) h = 60;
      if (node.depth >= 3) h = node.data.name.split(' ').length * 14 + 10;
      
      const pSpouseCount = node.data.spouses ? node.data.spouses.length : 0;
      let totalH = h;
      if (pSpouseCount > 0 && node.depth >= 3) {
          node.data.spouses.forEach(s => {
              let prefix = "";
              if (s.gender === "male" || node.data.gender === "female") prefix = "(Chồng) ";
              else prefix = "(Vợ) ";
              const displayName = prefix + s.name.toUpperCase();
              totalH += displayName.split(' ').length * 14 + 10;
          });
      } else if (pSpouseCount > 0) {
          totalH += h * pSpouseCount;
      }
      
      if (node.data.stackedSiblings && node.data.stackedSiblings.length > 0) {
          node.data.stackedSiblings.forEach(sib => {
              totalH += sib.name.split(' ').length * 14 + 10 + 15; // Include 15px line gap
          });
      }
      return totalH;
    })
    .childrenMargin((node) => profile.childrenMargin)
    .siblingsMargin((node) => profile.siblingMargin)
    .neighbourMargin((n1, n2) => profile.neighbourMargin)
    .initialZoom(profile.initialZoom)
    .buttonContent(() => "") 
    .linkUpdate(function (d, i, arr) {
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    })
    .nodeContent((node) => {
      const person = node.data;
      
      let baseW = 75;
      let baseH = 100;
      if (node.depth === 0) { baseW = 120; baseH = 140; }
      if (node.depth === 1) { baseW = 95; baseH = 120; }
      if (node.depth === 2) { baseW = 75; baseH = 60; }
      if (node.depth >= 3) { baseW = 55; }

      function renderBox(p, bw, bh_default, isSpouse = false, spousePrefix = "") {
        let titleStr = "";
        let birthStr = "";
        let deathHtml = "";
        let bh = bh_default;
        
        let displayName = spousePrefix + p.name.toUpperCase();

        if (node.depth >= 3) {
            bh = displayName.split(' ').length * 14 + 10;
        } else if (node.depth < 2) {
            titleStr = p.title ? `<div style="font-size: ${profile.metaFontSize}px; margin-bottom: 2px; font-weight: normal;">${p.title}</div>` : "";
            birthStr = p.birth_date ? `S: ${p.birth_date}` : "";
            const deathNote = window.getDeathNote(p.notes);
            deathHtml = deathNote 
              ? `<div style="font-size: ${profile.deathFontSize}px; color: black; margin-top:2px;">M: ${deathNote}</div>` : "";
        }

        let nameHtml = "";
        if (node.depth >= 3) {
            const words = displayName.split(' ').join('<br>');
            nameHtml = `<div style="font-weight: bold; font-size: 11px; color: black; line-height: 1.25; margin-bottom: 0;">${words}</div>`;
            if (isSpouse) {
                // Thêm đường kẻ ngang nhỏ phân cách giữa vợ/chồng theo sketch 
                nameHtml = `<div style="width: 100%; height: 1px; background: black; position: absolute; top: 0;"></div>` + nameHtml;
            }
        } else {
            nameHtml = `<div style="font-weight: bold; font-size: ${profile.nameFontSize}px; color: black; line-height: 1.2; margin-bottom: ${node.depth >= 2 ? '0' : '4px'};">${displayName}</div>`;
        }

        return `
          <div 
            onclick="event.stopPropagation(); window.showModalForId('${p.id}')"
            style="
            width: ${bw}px; 
            height: ${bh}px; 
            background: white; 
            border: ${profile.cardBorder}; 
            ${isSpouse ? 'border-top: none;' : ''}
            box-sizing: border-box;
            padding: ${profile.cardPadding};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: ${profile.fontFamily};
            text-align: center;
            cursor: pointer;
            overflow: hidden;
            position: relative;
            flex-shrink: 0;
          ">
            ${titleStr}
            ${nameHtml}
            <div style="font-size: ${profile.metaFontSize}px; color: black;">
              ${birthStr}
            </div>
            ${deathHtml}
          </div>
        `;
      }

      function renderSpouses(p, bw, bh) {
        let h = "";
        if (p.spouses && p.spouses.length > 0) {
          p.spouses.forEach(s => {
            let prefix = "";
            if (s.gender === "male" || p.gender === "female") prefix = "(Chồng) ";
            else prefix = "(Vợ) ";
            h += renderBox(s, bw, bh, true, prefix);
          });
        }
        return h;
      }

      let html = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center;">`;
      
      // Parent tier
      html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-start;">`;
      html += renderBox(person, baseW, baseH, false);
      html += renderSpouses(person, baseW, baseH);
      html += `</div>`;

      // Stacked Sibling tier (only for simple siblings at depth >= 3)
      if (person.stackedSiblings && person.stackedSiblings.length > 0) {
        html += `<div style="display:flex; flex-direction:column; align-items:center;">`;
        person.stackedSiblings.forEach(sib => {
           html += `<div style="width:1px; height:15px; background:black;"></div>`;
           html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-start;">`;
           html += renderBox(sib, baseW, 0, false); 
           html += `</div>`;
        });
        html += `</div>`;
      }

      html += `</div>`;
      return html;
    });

  chartInstance.render().expandAll();
  return chartInstance;
}
