import { IRComponentNode } from '../../ir/schema';
import { formatDart, indent } from '../dart-formatter';

/**
 * Wraps compiled widget code in a StatelessWidget class definition.
 * The bodyCode parameter is the already-compiled widget tree for the component's content.
 */
export function emitComponent(node: IRComponentNode, bodyCode: string): string {
  const className = toDartClassName(node.name);
  const indentedBody = indent(bodyCode.trimEnd(), 2);
  const returnStatement = `    return ${indentedBody.trimStart()};`;

  return formatDart(
    `class ${className} extends StatelessWidget {\n` +
      `  const ${className}({super.key});\n` +
      `\n` +
      `  @override\n` +
      `  Widget build(BuildContext context) {\n` +
      `${returnStatement}\n` +
      `  }\n` +
      `}`,
  );
}

/** Convert a Figma component name to a valid Dart PascalCase class name */
export function toDartClassName(name: string): string {
  return name
    .split(/[\s\-_\/\.]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
