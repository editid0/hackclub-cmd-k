import { Action, ActionPanel, Detail, List } from "@raycast/api";
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export default function Command() {
    const [uuid, setUuid] = useState("");
    const generateUUID = () => {
        const newUUID = uuidv4();
        setUuid(newUUID);
    };

    useState(() => {
        generateUUID();
    }, []);
    return (
        <Detail
            isLoading={!uuid}
            markdown={`### Generated UUID\n\n${uuid}`}
        />
    );
}
