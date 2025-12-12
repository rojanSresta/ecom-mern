import { create } from "zustand";
import axios from "../lib/axios";

export const useAiStore = create((set)=>({
    loading: false,

    chat: async(userMessage)=>{
        set({loading: true});
        try{
            const res = await axios.post("/chat", {query: userMessage});
            
            const aiResponse = res.data.message || "Sorry, can't fetch data";

            set({loading: false});
            console.log(aiResponse);
            
            return { text: aiResponse, sender: "ai" }; 
        }catch(error){            
            set({ loading: false });
            const errMsg = error.response?.data?.error || "Something went wrong";
            return { text: errMsg, sender: "ai", error: true };
        }
    }
}))