import "./detail-cards.css";

export interface LastUpdateLabelProps {
  text: string;
}

export function LastUpdateLabel({ text }: LastUpdateLabelProps) {
  return <p className="detail-last-update">{text}</p>;
}
