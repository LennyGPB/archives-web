/**
 * Renders `**emphasised**` segments of a translated string as `<strong>`,
 * so dictionaries stay plain text instead of carrying markup.
 */
export default function RichText({ children, className = "font-bold text-[#f4f3ef]" }: { children: string; className?: string }) {
  return (
    <>
      {children.split(/\*\*(.+?)\*\*/g).map((part, index) =>
        index % 2 === 1 ? (
          <strong className={className} key={index}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
