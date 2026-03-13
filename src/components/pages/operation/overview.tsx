import { Main } from "@/components/layout/main";
import { EndOperationCard } from "@/components/operation/end-operation-dialog";
import { OperationEventLog } from "@/components/operation/overview/event-log";
import { OperationNotes } from "@/components/operation/overview/notes";
import { RecordKeeper } from "@/components/operation/overview/record-keeper";
import { OperationStats } from "@/components/operation/overview/stats";
import type { Operation } from "@/livestore/schema/operation";

export const OperationOverviewPage = ({
  operation,
}: {
  operation: Operation;
}) => {
  return (
    <Main className="p-8 flex gap-8">
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        <OperationStats operation={operation} />
        <RecordKeeper operation={operation} />
        <OperationNotes operationId={operation.id} />
        <EndOperationCard operation={operation} />
      </div>
      <div className="w-96 shrink-0">
        <OperationEventLog operation={operation} />
      </div>
    </Main>
  );
};
