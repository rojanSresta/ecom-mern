import ai from "../lib/ai.js";

export const chat = async (req, res)=>{
    try{
        const {query} = req.body;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${query}`,
        });
        console.log(response.text);
        
        return res.status(200).json({message: response.text});
    }catch(e){
        console.log("Error in chat controller", e.message);
        res.status(500).json({message: e.message});
    }
}