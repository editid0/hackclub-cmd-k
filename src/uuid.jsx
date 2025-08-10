import { Action, ActionPanel, Detail, List } from "@raycast/api";
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export default function Command() {
    const [UUIDs, setUUIDs] = useState([]);
    const generateUUID = () => {
        setUUIDs([]);
        for (let i = 0; i < 8; i++) {
            const newUUID = uuidv4();
            setUUIDs((prevUUIDs) => [...prevUUIDs, newUUID]);
        }
    };
    useState(() => {
        generateUUID();
    }, []);
    return (
        <List>
            <List.EmptyView
                title="No UUIDs generated"
                description="Click the button below to generate UUIDs."
                actions={
                    <ActionPanel>
                        <Action title="Generate UUIDs" onAction={generateUUID} />
                    </ActionPanel>
                }
            />
            {UUIDs.map((uuid, index) => (
                <List.Item
                    key={index}
                    title={`UUID ${index + 1}`}
                    subtitle={uuid}
                    actions={
                        <ActionPanel>
                            <Action title="Generate UUIDs" onAction={generateUUID} />
                            <Action.CopyToClipboard content={uuid} title="Copy UUID" />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}
