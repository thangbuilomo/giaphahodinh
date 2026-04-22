let familyTreeDataPromise;

window.globalNodeMap = window.globalNodeMap || new Map();

window.loadFamilyTreeData = async function loadFamilyTreeData() {
  if (familyTreeDataPromise) {
    return familyTreeDataPromise;
  }

  familyTreeDataPromise = (async () => {
    const rawData = await fetch("gia_pha_ho_dinh.json").then((response) => response.json());

    window.globalNodeMap.clear();
    rawData.forEach((person) => window.globalNodeMap.set(person.id, person));

    const chartData = rawData.map((person) => {
      const spouses = [];

      if (person.pids && person.pids.length > 0) {
        person.pids.forEach((spouseId) => {
          if (window.globalNodeMap.has(spouseId)) {
            spouses.push(window.globalNodeMap.get(spouseId));
          }
        });
      }

      return {
        ...person,
        parentId: person.pid || "",
        spouses,
      };
    });

    const spouseIdsAsJoiners = new Set();
    chartData.forEach((person) => {
      if (person.parentId === "" && person.pids && person.pids.length > 0) {
        person.pids.forEach((spouseId) => {
          const partner = window.globalNodeMap.get(spouseId);
          if (partner && (partner.pid !== "" || partner.id === "1") && person.id !== "1") {
            spouseIdsAsJoiners.add(person.id);
          }
        });
      }
    });

    const finalTreeData = chartData.filter((person) => !spouseIdsAsJoiners.has(person.id));
    const diedYoungIds = new Set(["15", "16", "17", "41", "42"]);
    let hasDiedYoungGroup = false;

    finalTreeData.forEach((person) => {
      if (diedYoungIds.has(person.id)) {
        person.parentId = "group_died_young";
        hasDiedYoungGroup = true;
      }
    });

    if (hasDiedYoungGroup) {
      finalTreeData.push({
        id: "group_died_young",
        parentId: "1",
        name: "Cac con mat khi nho",
        gender: "male",
        birth_date: "9900",
        title: "",
        spouses: [],
      });
    }

    const explicitOrder = {
      "3": 1,
      "18": 2,
      "31": 3,
      "43": 4,
      "60": 5,
      group_died_young: 6,
    };

    finalTreeData.sort((left, right) => getSortValue(left, explicitOrder) - getSortValue(right, explicitOrder));
    return finalTreeData;
  })();

  return familyTreeDataPromise;
};

window.getDeathNote = function getDeathNote(notes) {
  if (!notes) {
    return "";
  }

  const match = notes.match(/((?:Mất|Mat):.*)/i);
  return match ? match[1].trim() : "";
};

window.isAdoptedTitle = function isAdoptedTitle(title) {
  if (!title) {
    return false;
  }

  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return normalized.includes("con nuoi");
};

window.applyDefaultLinkStyle = function applyDefaultLinkStyle() {
  d3.select(this)
    .attr("stroke", "#64748b")
    .attr("stroke-width", 2);
};

window.renderChartError = function renderChartError() {
  const container = document.getElementById("chart-container");
  if (!container) {
    return;
  }

  container.innerHTML =
    '<p style="color:#b91c1c; margin:2rem; font-family:Inter,sans-serif;">Khong tai duoc du lieu. Hay chay localhost truoc.</p>';
};

window.bindChartControls = function bindChartControls(getChart) {
  const fitButton = document.getElementById("btn-fit");
  const expandButton = document.getElementById("btn-expand");
  const collapseButton = document.getElementById("btn-collapse");

  if (!fitButton || fitButton.dataset.bound === "true") {
    return;
  }

  const runIfReady = (action) => {
    const chart = getChart();
    if (chart) {
      action(chart);
    }
  };

  fitButton.dataset.bound = "true";
  fitButton.addEventListener("click", () => runIfReady((chart) => chart.fit()));

  if (expandButton) {
    expandButton.addEventListener("click", () => runIfReady((chart) => chart.expandAll().fit()));
  }

  if (collapseButton) {
    collapseButton.addEventListener("click", () => runIfReady((chart) => chart.collapseAll().fit()));
  }
};

window.bindPdfExportButton = function bindPdfExportButton(onExport) {
  const exportButton = document.getElementById("btn-pdf");

  if (!exportButton || exportButton.dataset.bound === "true") {
    return;
  }

  exportButton.dataset.bound = "true";
  exportButton.addEventListener("click", async () => {
    const originalLabel = exportButton.textContent;
    exportButton.disabled = true;
    exportButton.textContent = "Dang xuat...";

    try {
      await onExport();
    } catch (error) {
      console.error("PDF export failed:", error);
      window.alert("Khong xuat duoc PDF. Hay thu lai sau.");
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = originalLabel;
    }
  });
};

window.getPrintViewState = function getPrintViewState() {
  const params = new URLSearchParams(window.location.search);
  return {
    enabled: params.get("print") === "1",
    autoPrint: params.get("autoprint") === "1",
  };
};

window.openPrintWindow = function openPrintWindow() {
  const url = new URL(window.location.href);
  url.searchParams.set("print", "1");
  url.searchParams.set("autoprint", "1");

  const popup = window.open(url.toString(), "_blank");
  if (!popup) {
    window.location.href = url.toString();
  }
};

window.setupPrintSheet = function setupPrintSheet({ title, subtitle }) {
  document.body.classList.add("print-mode");

  const wrapper = document.querySelector(".chart-wrapper");
  const container = document.getElementById("chart-container");

  if (!wrapper || !container || wrapper.dataset.printReady === "true") {
    return;
  }

  const header = document.createElement("div");
  const titleBlock = document.createElement("div");
  const metaBlock = document.createElement("div");

  header.className = "print-sheet-header";
  titleBlock.className = "print-sheet-titleblock";
  metaBlock.className = "print-sheet-meta";

  titleBlock.innerHTML = `
    <div class="print-sheet-title">${title}</div>
    <div class="print-sheet-subtitle">${subtitle}</div>
  `;

  metaBlock.innerHTML = `
    <div class="print-sheet-note">Khổ A3 landscape</div>
    <div class="print-sheet-date">In lúc ${formatHumanDateTime(new Date())}</div>
  `;

  container.classList.add("print-chart-container");
  header.appendChild(titleBlock);
  header.appendChild(metaBlock);
  wrapper.prepend(header);
  wrapper.dataset.printReady = "true";
};

window.triggerAutoPrint = async function triggerAutoPrint() {
  await waitMs(700);

  const closeIfPopup = () => {
    if (window.opener) {
      window.close();
    }
  };

  window.addEventListener("afterprint", closeIfPopup, { once: true });
  window.print();
};

window.exportChartWithPrintProfile = async function exportChartWithPrintProfile(options) {
  if (!window.html2canvas || !window.jspdf) {
    throw new Error("Missing PDF export libraries.");
  }

  const {
    filenamePrefix = "gia-pha",
    pageFormat = "a3",
    pageOrientation = "landscape",
    marginMm = 6,
    stageWidthPx = 1600,
    stageHeightPx = 1131,
    stagePaddingPx = 24,
    captureScale = 3,
    renderChart,
  } = options;

  const stage = createPrintStage({
    widthPx: stageWidthPx,
    heightPx: stageHeightPx,
    paddingPx: stagePaddingPx,
  });

  try {
    const exportChart = await renderChart({
      containerSelector: stage.containerSelector,
      containerElement: stage.containerElement,
      stageElement: stage.stageElement,
    });

    if (exportChart && typeof exportChart.fit === "function") {
      exportChart.fit();
      await waitMs(450);
      exportChart.fit();
      await waitMs(250);
    }

    const canvas = await window.html2canvas(stage.stageElement, {
      backgroundColor: stage.backgroundColor,
      scale: captureScale,
      useCORS: true,
      logging: false,
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: pageOrientation,
      unit: "mm",
      format: pageFormat,
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pageWidth - marginMm * 2;
    const usableHeight = pageHeight - marginMm * 2;
    const imageRatio = canvas.width / canvas.height;
    const pageRatio = usableWidth / usableHeight;

    let renderWidth = usableWidth;
    let renderHeight = usableHeight;

    if (imageRatio > pageRatio) {
      renderHeight = usableWidth / imageRatio;
    } else {
      renderWidth = usableHeight * imageRatio;
    }

    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;
    const imageData = canvas.toDataURL("image/png");

    pdf.addImage(imageData, "PNG", offsetX, offsetY, renderWidth, renderHeight, undefined, "FAST");
    pdf.save(`${filenamePrefix}-${formatDateForFileName(new Date())}.pdf`);
  } finally {
    stage.cleanup();
  }
};

window.initPersonModal = function initPersonModal() {
  const modal = document.getElementById("detail-modal");
  const closeButton = document.querySelector(".close-btn");

  if (!modal || !closeButton || modal.dataset.bound === "true") {
    return;
  }

  const showModal = (person) => {
    document.getElementById("modal-name").textContent = person.name || "Khong ro";
    document.getElementById("modal-title").textContent =
      person.title || (person.gender === "female" ? "Nu gioi" : "Nam gioi");
    document.getElementById("modal-birth").textContent = person.birth_date || "Khong co thong tin";
    document.getElementById("modal-hometown").textContent = person.hometown || "Khong co thong tin";
    document.getElementById("modal-notes").innerHTML = person.notes || "";

    const initials = person.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2) || "?";
    document.getElementById("modal-avatar").textContent = initials;

    let spouseText = "Khong co";
    if (person.pids && person.pids.length > 0) {
      spouseText = person.pids
        .map((spouseId) => {
          const spouse = window.globalNodeMap.get(spouseId);
          return spouse ? spouse.name : "";
        })
        .filter(Boolean)
        .join(", ");
    }
    document.getElementById("modal-spouses").textContent = spouseText;

    modal.classList.remove("hidden");
  };

  window.showModalForId = (id) => {
    const person = window.globalNodeMap.get(id);
    if (person) {
      showModal(person);
    }
  };

  closeButton.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });

  modal.dataset.bound = "true";
};

function createPrintStage({ widthPx, heightPx, paddingPx }) {
  const backgroundColor =
    getComputedStyle(document.documentElement).getPropertyValue("--bg-color").trim() || "#fdfbf7";
  const stageElement = document.createElement("div");
  const frameElement = document.createElement("div");
  const containerElement = document.createElement("div");
  const containerId = `print-chart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  containerElement.id = containerId;

  Object.assign(stageElement.style, {
    position: "fixed",
    left: "-20000px",
    top: "0",
    width: `${widthPx}px`,
    height: `${heightPx}px`,
    padding: `${paddingPx}px`,
    boxSizing: "border-box",
    overflow: "hidden",
    backgroundColor,
    zIndex: "-1",
    pointerEvents: "none",
  });

  Object.assign(frameElement.style, {
    width: "100%",
    height: "100%",
    backgroundColor,
    backgroundImage:
      "linear-gradient(rgba(200, 200, 200, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.1) 1px, transparent 1px)",
    backgroundSize: "30px 30px",
  });

  Object.assign(containerElement.style, {
    width: "100%",
    height: "100%",
  });

  frameElement.appendChild(containerElement);
  stageElement.appendChild(frameElement);
  document.body.appendChild(stageElement);

  return {
    stageElement,
    containerElement,
    containerSelector: `#${containerId}`,
    backgroundColor,
    cleanup() {
      stageElement.remove();
    },
  };
}

function parseDateForSort(dateStr) {
  if (!dateStr || dateStr.trim() === "") {
    return 99999999;
  }

  const normalized = dateStr.replace(/\s/g, "");
  const parts = normalized.includes("/") ? normalized.split("/") : normalized.split("-");

  if (parts.length === 1) {
    const year = parseInt(parts[0], 10);
    return Number.isNaN(year) ? 99999999 : year * 10000;
  }

  if (parts.length === 3) {
    const day = parseInt(parts[0], 10) || 1;
    const month = parseInt(parts[1], 10) || 1;
    const year = parseInt(parts[2], 10);
    return Number.isNaN(year) ? 99999999 : year * 10000 + month * 100 + day;
  }

  return 99999999;
}

function getSortValue(person, explicitOrder) {
  if (window.isAdoptedTitle(person.title)) {
    return 99999;
  }

  if (person.parentId === "1" && explicitOrder[person.id]) {
    return explicitOrder[person.id] * 1000;
  }

  return parseDateForSort(person.birth_date);
}

function formatDateForFileName(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}`;
}

function formatHumanDateTime(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
