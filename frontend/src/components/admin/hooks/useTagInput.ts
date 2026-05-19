import { useCallback, useState } from "react"
import type { LocalizedText } from "../../../types/production"

export type TagItem = {
    id: string
    name: LocalizedText
}

export const useTagInput = () => {
    const [input, setInput] = useState('');
    const [items, setItems] = useState<TagItem[]>([]);
    
    const add = useCallback((id: string, text: LocalizedText) => {
        setItems(prev =>
            prev.some(t => t.id === id)
                ? prev
                : [...prev, { id, name: text }]
        );
        setInput('');
    }, []);

    const remove = useCallback((id: string) => {
        setItems(prev => prev.filter(t => t.id !== id));
    }, []);
    
    const clear = useCallback(() => {
        setItems([]);
        setInput('');
    }, [])

    return {
        input,
        items,
        add,
        remove,
        setInput,
        clear
    }
}
