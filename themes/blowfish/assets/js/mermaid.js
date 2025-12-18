function css(name) {
  return "rgb(" + getComputedStyle(document.documentElement).getPropertyValue(name) + ")";
}

// 初始化Mermaid
console.log("Mermaid.js loaded");
if (typeof mermaid !== 'undefined') {
  console.log("Mermaid library found");
  
  // 使用简单的配置
  mermaid.initialize({
    startOnLoad: true,
    theme: "default",
    securityLevel: "loose"
  });
  
  console.log("Mermaid initialized with simple config");
  
  // 渲染所有Mermaid图表
  console.log("Rendering Mermaid diagrams");
  try {
    mermaid.run();
    console.log("Mermaid diagrams rendered successfully");
  } catch (error) {
    console.error("Error rendering Mermaid diagrams:", error);
  }
} else {
  console.error("Mermaid library not found");
}