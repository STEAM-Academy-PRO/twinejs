import React, { useRef } from "react";
import { useEffect, useState } from "react";
import { Passage } from "../../store/stories";
import { renderScene } from "../../util/passage-render";

export default function Scene({passage}: {passage: Passage}){

    const [svg, setSvg] = useState<string>('');
    const svgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log('rerendering scene', passage.svg)
        renderScene(passage, true).then((svg)=>{
            setSvg(svg)
    })
    }, [passage]);


    return <div ref={svgRef!} dangerouslySetInnerHTML={{__html: svg}}></div>
}