declare module 'archy' {
  interface ArchyNode {
    label: string;
    nodes?: Array<ArchyNode | string>;
  }

  export default function archy(data: ArchyNode, prefix?: string, opts?: any): string;
}
