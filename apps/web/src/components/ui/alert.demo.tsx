import { Alert } from "./alert";
export default function AlertDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info" title="Information">
        This is an info alert.
      </Alert>
      <Alert variant="success" title="Success">
        This is a success alert.
      </Alert>
      <Alert variant="warning" title="Warning">
        This is a warning alert.
      </Alert>
      <Alert variant="danger" title="Danger">
        This is a danger alert.
      </Alert>
    </div>
  );
}
