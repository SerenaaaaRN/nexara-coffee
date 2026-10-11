import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { getContext } from "./root-provider";

export default {
    name: "Tanstack Query",
    render: <ReactQueryDevtoolsPanel client={getContext().queryClient} />,
};
