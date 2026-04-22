let chart;

const HORIZONTAL_CARD_WIDTH = 180;
const HORIZONTAL_CARD_HEIGHT = 85;
const HORIZONTAL_SPOUSE_GAP = 50;

window.currentLayout = "top";

window.initPersonModal();
window.bindChartControls(() => chart);
window.bindPdfExportButton(() => chart, { filenamePrefix: "gia-pha-ngang" });

(async function renderHorizontalChart() {
  try {
    const treeData = await window.loadFamilyTreeData();

    chart = new d3.OrgChart()
      .container("#chart-container")
      .data(treeData)
      .layout("top")
      .compact(false)
      .nodeWidth((node) => {
        const spouseCount = node.data.spouses ? node.data.spouses.length : 0;
        return HORIZONTAL_CARD_WIDTH + spouseCount * (HORIZONTAL_CARD_WIDTH + HORIZONTAL_SPOUSE_GAP);
      })
      .nodeHeight(() => HORIZONTAL_CARD_HEIGHT)
      .childrenMargin(() => 60)
      .siblingsMargin(() => 40)
      .initialZoom(0.85)
      .buttonContent(() => "")
      .linkUpdate(window.applyDefaultLinkStyle)
      .nodeContent((node) => {
        const person = node.data;

        if (person.id === "group_died_young") {
          return createGroupNodeHtml(person.name);
        }

        let html = '<div style="display:flex; flex-direction:row; align-items:center; height:100%; width:100%; box-sizing:border-box;">';
        html += createHorizontalCardHtml(person);

        if (person.spouses && person.spouses.length > 0) {
          person.spouses.forEach((spouse) => {
            html += createHorizontalConnectorHtml();
            html += createHorizontalCardHtml(spouse);
          });
        }

        html += "</div>";
        return html;
      })
      .render()
      .expandAll();
  } catch (error) {
    console.error("Error building horizontal tree:", error);
    window.renderChartError();
  }
})();

function createHorizontalCardHtml(person) {
  const isFemale = person.gender === "female";
  const backgroundColor = isFemale ? "var(--node-bg-female, #fce7f3)" : "var(--node-bg-male, #e0f2fe)";
  const borderColor = isFemale ? "var(--node-border-female, #f9a8d4)" : "var(--node-border-male, #7dd3fc)";
  const birthDate = person.birth_date ? `Sinh: ${person.birth_date}` : "Sinh: Không rõ";
  const deathNote = window.getDeathNote(person.notes);
  const deathHtml = deathNote ? `<div style="font-size:9px; font-weight:600; color:#ef4444;">${deathNote}</div>` : "";
  const badgeHtml =
    person.title && !person.title.includes("Con nuôi")
      ? `<span style="background:rgba(0,0,0,0.05); padding:1px 4px; border-radius:4px; font-size:8px; white-space:nowrap; flex-shrink:0;">${person.title}</span>`
      : "";

  return `
    <div
      onclick="event.stopPropagation(); window.showModalForId('${person.id}')"
      style="cursor:pointer; background-color:${backgroundColor}; border:1px solid ${borderColor}; border-radius:8px; padding:6px 10px; color:#0f172a; font-family:'Inter',sans-serif; flex:0 0 ${HORIZONTAL_CARD_WIDTH}px; width:${HORIZONTAL_CARD_WIDTH}px; height:${HORIZONTAL_CARD_HEIGHT}px; display:flex; flex-direction:column; justify-content:center; box-sizing:border-box; box-shadow:0 2px 4px rgba(0,0,0,0.05); transition:transform 0.2s;"
      onmouseover="this.style.transform='scale(1.02)'"
      onmouseout="this.style.transform='scale(1)'"
    >
      <div style="font-weight:700; font-size:12px; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#0f172a;">
        ${person.name}
      </div>
      <div style="font-size:11px; color:#475569; display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${birthDate}</span>
        ${badgeHtml}
      </div>
      ${deathHtml}
    </div>
  `;
}

function createHorizontalConnectorHtml() {
  return `
    <div style="flex:0 0 ${HORIZONTAL_SPOUSE_GAP}px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8;">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      <div style="width:100%; height:2px; background-color:#fda4af;"></div>
    </div>
  `;
}

function createGroupNodeHtml(name) {
  return `
    <div style="background-color:#fef2f2; border:1px dashed #ef4444; border-radius:8px; padding:8px 10px; font-family:'Inter',sans-serif; width:100%; height:100%; box-sizing:border-box; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
      <div style="font-weight:700; font-size:12px; color:#b91c1c; text-align:center;">
        ${name}
      </div>
    </div>
  `;
}
