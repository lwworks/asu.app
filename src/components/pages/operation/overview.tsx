import { Main } from "@/components/layout/main";
import { OperationStats } from "@/components/operation/overview/stats";
import type { Operation } from "@/livestore/schema/operation";

export const OperationOverviewPage = ({operation}: {operation: Operation}) => {
  return <Main className="p-8">
    <OperationStats operation={operation} />
  </Main>;
};