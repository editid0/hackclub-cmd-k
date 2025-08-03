import { Action, ActionPanel, Detail, List } from "@raycast/api";
import { useEffect, useState } from "react";

export default function Command() {
    const [categories, setCategories] = useState([]);
    const [tools, setTools] = useState([]);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (categories) {
            const allTools = Object.entries(categories).flatMap(([category, tools]) =>
                tools.map(tool => ({ ...tool, category }))
            );
            setTools(allTools);
        }
    }, [categories]);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const response = await fetch("https://beta.modu.tools/api/tools");
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleSearch = (query) => {
        setSearch(query);
        if (query.length < 3) {
            setResults([]);
            return;
        }

        const filteredResults = tools.filter((tool) =>
            tool.name.toLowerCase().includes(query.toLowerCase()) ||
            tool.description.toLowerCase().includes(query.toLowerCase())
        );

        setResults(filteredResults);
    };
    return (
        <List
            isLoading={loading}
            searchBarPlaceholder="Search tools..."
            onSearchTextChange={handleSearch}
        >
            {results.map((tool) => (
                <List.Item
                    key={tool.name}
                    title={tool.name}
                    subtitle={tool.description}
                    actions={
                        <ActionPanel>
                            <Action.OpenInBrowser url={'https://beta.modu.tools' + tool.link} />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}
