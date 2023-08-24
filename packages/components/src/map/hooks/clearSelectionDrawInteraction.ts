// ⤵ type
import type { VisualMap } from "../type";

const clearSelectionDrawInteraction = (mapCase: VisualMap) => {
  // 关闭框选
  if (mapCase?.get("boxSelectionDrawInteraction")) {
    mapCase?.removeInteraction(mapCase?.get("boxSelectionDrawInteraction"));
    mapCase?.set("boxSelectionDrawInteraction", null);
  }
  if (mapCase?.get("boxSelectionSource")) {
    mapCase?.get("boxSelectionSource")?.clear();
    mapCase?.set("boxSelectionSource", null);
  }
};

export { clearSelectionDrawInteraction };
