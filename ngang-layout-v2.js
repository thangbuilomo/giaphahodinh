let chart;

const SCREEN_PROFILE = {
  cardWidth: 180,
  cardHeight: 85,
  spouseGap: 50,
  childrenMargin: 60,
  siblingMargin: 40,
  initialZoom: 0.85,
  cardPadding: "6px 10px",
  cardRadius: 8,
  nameFontSize: 12,
  nameGap: 3,
  metaFontSize: 11,
  deathFontSize: 9,
  badgeFontSize: 8,
  badgePlacement: "inline",
  badgePadding: "1px 4px",
  shadow: "0 2px 4px rgba(0,0,0,0.05)",
  hoverShadow: "0 2px 4px rgba(0,0,0,0.05)",
  interactive: true,
  linkWidth: 2,
  groupPadding: "8px 10px",
  groupRadius: 8,
};

const PRINT_PROFILE = {
  cardWidth: 146,
  cardHeight: 62,
  spouseGap: 24,
  childrenMargin: 34,
  siblingMargin: 20,
  initialZoom: 1,
  cardPadding: "5px 7px",
  cardRadius: 7,
  nameFontSize: 9.5,
  nameGap: 2,
  metaFontSize: 7.5,
  deathFontSize: 7.5,
  badgeFontSize: 6.5,
  badgePlacement: "stacked",
  badgePadding: "1px 4px",
  shadow: "0 1px 2px rgba(0,0,0,0.05)",
  hoverShadow: "0 1px 2px rgba(0,0,0,0.05)",
  interactive: false,
  linkWidth: 1.5,
  groupPadding: "6px 8px",
  groupRadius: 7,
};

const EXPORT_PROFILE = {
  filenamePrefix: "gia-pha-ngang-a3",
  pageFormat: "a3",
  pageOrientation: "landscape",
  stageWidthPx: 1600,
  stageHeightPx: 1131,
  stagePaddingPx: 24,
  captureScale: 3,
};

window.currentLayout = "top";
const printView = window.getPrintViewState();

window.initPersonModal();
if (!printView.enabled) {
  window.bindChartControls(() => chart);
  window.bindPdfExportButton(() => window.openPrintWindow());
} else {
  window.setupPrintSheet({
    title: "Gia pha ho Dinh",
    subtitle: "Ban in A3 toi uu cho so do ngang",
  });
}

(async function renderHorizontalChartPage() {
  try {
    const treeData = await window.loadFamilyTreeData();
    chart = createHorizontalChart("#chart-container", treeData, printView.enabled ? PRINT_PROFILE : SCREEN_PROFILE);

    if (printView.enabled && printView.autoPrint) {
      await window.triggerAutoPrint();
    }
  } catch (error) {
    console.error("Error building horizontal tree:", error);
    window.renderChartError();
  }
})();

function createHorizontalChart(containerSelector, treeData, profile) {
  const chartInstance = new d3.OrgChart()
    .container(containerSelector)
    .data(treeData)
    .layout("top")
    .compact(false)
    .nodeWidth((node) => {
      const spouseCount = node.data.spouses ? node.data.spouses.length : 0;
      return profile.cardWidth + spouseCount * (profile.cardWidth + profile.spouseGap);
    })
    .nodeHeight(() => profile.cardHeight)
    .childrenMargin(() => profile.childrenMargin)
    .siblingsMargin(() => profile.siblingMargin)
    .initialZoom(profile.initialZoom)
    .buttonContent(() => "")
    .linkUpdate(function () {
      d3.select(this)
        .attr("stroke", "#64748b")
        .attr("stroke-width", profile.linkWidth);
    })
    .nodeContent((node) => {
      const person = node.data;

      if (person.id === "group_died_young") {
        return createHorizontalGroupNodeHtml(person.name, profile);
      }

      let html =
        '<div style="display:flex; flex-direction:row; align-items:center; height:100%; width:100%; box-sizing:border-box;">';
      html += createHorizontalCardHtml(person, profile);

      if (person.spouses && person.spouses.length > 0) {
        person.spouses.forEach((spouse) => {
          html += createHorizontalConnectorHtml(profile);
          html += createHorizontalCardHtml(spouse, profile);
        });
      }

      html += "</div>";
      return html;
    });

  chartInstance.render().expandAll();
  return chartInstance;
}

function createHorizontalCardHtml(person, profile) {
  const isFemale = person.gender === "female";
  const backgroundColor = isFemale ? "var(--node-bg-female, #fce7f3)" : "var(--node-bg-male, #e0f2fe)";
  const borderColor = isFemale ? "var(--node-border-female, #f9a8d4)" : "var(--node-border-male, #7dd3fc)";
  const birthDate = person.birth_date ? `Sinh: ${person.birth_date}` : "Sinh: Khong ro";
  const deathNote = window.getDeathNote(person.notes);
  const deathHtml = deathNote
    ? `<div style="margin-top:2px; font-size:${profile.deathFontSize}px; font-weight:600; line-height:1.25; color:#ef4444; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${deathNote}</div>`
    : "";
  const badgeInline =
    person.title && !window.isAdoptedTitle(person.title) && profile.badgePlacement === "inline"
      ? `<span style="background:rgba(0,0,0,0.05); padding:${profile.badgePadding}; border-radius:4px; font-size:${profile.badgeFontSize}px; white-space:nowrap; flex-shrink:0;">${person.title}</span>`
      : "";
  const badgeStacked =
    person.title && !window.isAdoptedTitle(person.title) && profile.badgePlacement === "stacked"
      ? `<div style="margin-top:4px; align-self:flex-start; background:rgba(0,0,0,0.05); padding:${profile.badgePadding}; border-radius:999px; font-size:${profile.badgeFontSize}px; white-space:nowrap; color:#475569;">${person.title}</div>`
      : "";

  const interactiveAttributes = profile.interactive
    ? `onclick="event.stopPropagation(); window.showModalForId('${person.id}')" ontouchstart="window.handleNodeTouchStart(event, this)" ontouchend="window.handleNodeTouchEnd(event, this, '${person.id}')" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='${profile.hoverShadow}'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='${profile.shadow}'"`
    : "";

  return `
    <div
      ${interactiveAttributes}
      style="cursor:${profile.interactive ? "pointer" : "default"}; background-color:${backgroundColor}; border:1px solid ${borderColor}; border-radius:${profile.cardRadius}px; padding:${profile.cardPadding}; color:#0f172a; font-family:'Inter',sans-serif; flex:0 0 ${profile.cardWidth}px; width:${profile.cardWidth}px; height:${profile.cardHeight}px; display:flex; flex-direction:column; justify-content:flex-start; box-sizing:border-box; box-shadow:${profile.shadow}; transition:${profile.interactive ? "transform 0.2s, box-shadow 0.2s" : "none"};">
      <div style="font-weight:700; font-size:${profile.nameFontSize}px; line-height:1.3; margin-bottom:${profile.nameGap}px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#0f172a;">
        ${person.name}
      </div>
      <div style="font-size:${profile.metaFontSize}px; color:#475569; display:flex; justify-content:space-between; align-items:center; gap:6px;">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${birthDate}</span>
        ${badgeInline}
      </div>
      ${deathHtml}
      ${badgeStacked}
    </div>
  `;
}

function createHorizontalConnectorHtml(profile) {
  return `
    <div style="flex:0 0 ${profile.spouseGap}px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.8;">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      <div style="width:100%; height:2px; background-color:#fda4af;"></div>
    </div>
  `;
}

function createHorizontalGroupNodeHtml(name, profile) {
  return `
    <div style="background-color:#fef2f2; border:1px dashed #ef4444; border-radius:${profile.groupRadius}px; padding:${profile.groupPadding}; font-family:'Inter',sans-serif; width:100%; height:100%; box-sizing:border-box; display:flex; align-items:center; justify-content:center; box-shadow:${profile.shadow};">
      <div style="font-weight:700; font-size:${profile.badgeFontSize + 4}px; color:#b91c1c; text-align:center;">
        ${name}
      </div>
    </div>
  `;
}
