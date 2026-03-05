import { IRScreenshots, IRScreenshot } from '../../ir/schema';

/**
 * Export a PNG screenshot from a Figma node at the specified scale.
 * Uses Figma's exportAsync API and converts to base64.
 */
export async function extractScreenshots(
  node: SceneNode,
  scale: number = 2,
): Promise<IRScreenshots> {
  const screenshot = await exportNodeScreenshot(node, scale);
  return { root: screenshot };
}

async function exportNodeScreenshot(
  node: SceneNode,
  scale: number,
): Promise<IRScreenshot> {
  const bytes = await node.exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: scale },
  });

  // Convert Uint8Array to base64 in Figma environment
  const base64 = uint8ArrayToBase64(bytes);

  return {
    nodeId: node.id,
    nodeName: node.name,
    scale,
    width: Math.round(node.width * scale),
    height: Math.round(node.height * scale),
    base64,
  };
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
