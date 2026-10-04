import { Card, CardContent, CardHeader, CardTitle } from "./card";
export default function CardDemo() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>This is the content inside a surface container.</CardContent>
    </Card>
  );
}
