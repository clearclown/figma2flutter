import { INDENT } from '../shared/constants';

/** Indent every line of code by the given depth */
export function indent(code: string, depth: number): string {
  const prefix = INDENT.repeat(depth);
  return code
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : prefix + line))
    .join('\n');
}

/** Remove trailing whitespace from each line and ensure single trailing newline */
export function formatDart(code: string): string {
  return (
    code
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trimEnd() + '\n'
  );
}
