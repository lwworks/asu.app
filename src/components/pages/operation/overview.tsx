import { Main } from "@/components/layout/main";
import { CompleteOperation } from "@/components/operation/overview/complete-operation";
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
        <div className="grid grid-cols-2 gap-8">
          <RecordKeeper operation={operation} />
          <CompleteOperation operation={operation} />
        </div>
        <OperationNotes operationId={operation.id} />
      </div>
      <div className="w-96 shrink-0">
        <OperationEventLog operation={operation} />
      </div>
    </Main>
  );
};
