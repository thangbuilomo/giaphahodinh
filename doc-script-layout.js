let chart;

const VERTICAL_CARD_WIDTH = 220;
const VERTICAL_CARD_HEIGHT = 82;
const VERTICAL_CONNECTOR_GAP = 26;
const VERTICAL_CHILDREN_MARGIN = 110;
const VERTICAL_SIBLING_MARGIN = 34;

window.currentLayout = "left";

window.initPersonModal();
window.bindChartControls(() => chart);
window.bindPdfExportButton(() => chart, { filenamePrefix: "gia-pha-doc" });

(async function renderVerticalChart() {
  try {
    const treeData = await window.loadFamilyTreeData();

    chart = new d3.OrgChart()
      .container("#chart-container")
      .data(treeData)
      .layout("left")
      .compact(false)
      .nodeWidth(() => VERTICAL_CARD_WIDTH)
      .nodeHeight((node) => {
        const spouseCount = node.data.spouses ? node.data.spouses.length : 0;
        return VERTICAL_CARD_HEIGHT + spouseCount * (VERTICAL_CARD_HEIGHT + VERTICAL_CONNECTOR_GAP);
      })
      .childrenMargin(() => VERTICAL_CHILDREN_MARGIN)
      .siblingsMargin(() => VERTICAL_SIBLING_MARGIN)
      .initialZoom(0.78)
      .buttonContent(() => "")
      .linkUpdate(window.applyDefaultLinkStyle)
      .nodeContent((node) => {
        const person = node.data;

        if (person.id === "group_died_young") {
          return createVerticalGroupNodeHtml(person.name);
        }

        let html = '<div style="display:flex; flex-direction:column; align-items:center; height:100%; width:100%; box-sizing:border-box;">';
        html += createVerticalCardHtml(person);

        if (person.spouses && person.spouses.length > 0) {
          person.spouses.forEach((spouse) => {
            html += createVerticalConnectorHtml();
            html += createVerticalCardHtml(spouse);
          });
        }

        html += "</div>";
        return html;
      })
      .render()
      .expandAll();
  } catch (error) {
    console.error("Error building vertical tree:", error);
    window.renderChartError();
  }
})();

function createVerticalCardHtml(person) {
  const isFemale = person.gender === "female";
  const backgroundColor = isFemale ? "var(--node-bg-female, #fdf2f8)" : "var(--node-bg-male, #e0f2fe)";
  const borderColor = isFemale ? "var(--node-border-female, #f9a8d4)" : "var(--node-border-male, #7dd3fc)";
  const birthDate = person.birth_date ? `Sinh: ${person.birth_date}` : "Sinh: Không rõ";
  const deathNote = window.getDeathNote(person.notes);
  const deathHtml = deathNote
    ? `<div style="margin-top:4px; font-size:10px; font-weight:600; line-height:1.3; color:#ef4444; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${deathNote}</div>`
    : "";
  const badgeHtml =
    person.title && !person.title.includes("Con nuôi")
      ? `<div style="margin-top:6px; align-self:flex-start; background:rgba(15,23,42,0.06); color:#475569; padding:2px 6px; border-radius:999px; font-size:8px; line-height:1.2; white-space:nowrap;">${person.title}</div>`
      : "";

  return `
    <div
      onclick="event.stopPropagation(); window.showModalForId('${person.id}')"
      style="cursor:pointer; background-color:${backgroundColor}; border:1px solid ${borderColor}; border-radius:12px; padding:10px 14px; color:#0f172a; font-family:'Inter',sans-serif; flex:0 0 ${VERTICAL_CARD_HEIGHT}px; width:${VERTICAL_CARD_WIDTH}px; height:${VERTICAL_CARD_HEIGHT}px; display:flex; flex-direction:column; justify-content:flex-start; box-sizing:border-box; box-shadow:0 4px 12px rgba(15,23,42,0.06); transition:transform 0.2s, box-shadow 0.2s;"
      onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 8px 18px rgba(15,23,42,0.10)'"
      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(15,23,42,0.06)'"
    >
      <div style="min-width:0; width:100%; display:flex; flex-direction:column;">
        <div style="font-weight:700; font-size:12px; line-height:1.3; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#0f172a;">
          ${person.name}
        </div>
        <div style="font-size:10px; line-height:1.35; color:#475569; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${birthDate}
        </div>
        ${deathHtml}
        ${badgeHtml}
      </div>
    </div>
  `;
}

function createVerticalConnectorHtml() {
  return `
    <div style="flex:0 0 ${VERTICAL_CONNECTOR_GAP}px; width:100%; display:flex; align-items:center; justify-content:center; position:relative;">
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
        <div style="width:2px; height:100%; background-color:#fda4af;"></div>
      </div>
      <div style="width:18px; height:18px; border-radius:999px; background:#ffffff; display:flex; align-items:center; justify-content:center; position:relative; z-index:2; box-shadow:0 0 0 2px rgba(255,255,255,0.95);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.9;">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </div>
  `;
}

function createVerticalGroupNodeHtml(name) {
  return `
    <div style="background-color:#fff1f2; border:1px dashed #fb7185; border-radius:12px; padding:12px 14px; font-family:'Inter',sans-serif; width:100%; height:100%; box-sizing:border-box; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(15,23,42,0.06);">
      <div style="font-weight:700; font-size:12px; line-height:1.35; color:#be123c; text-align:center;">
        ${name}
      </div>
    </div>
  `;
}
