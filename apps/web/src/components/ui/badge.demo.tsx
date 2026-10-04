import { Badge } from "./badge";
export default function BadgeDemo() {
  return (
    <div className="flex gap-4">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
    </div>
  );
}
