window.onload = () => {
    renderTree();
}

const nodesClicked = [];

const getData = async (file) => {
    const api = `https://raw.githubusercontent.com/episphere/conceptGithubActions/master/${file}`;
    const response = await fetch(api)
    const concepts = await response.json();
    return concepts;
}

const renderTree = async () => {
    const data = await getData('collapsibleTree.json');
    const csv = (await (await fetch('https://raw.githubusercontent.com/episphere/conceptGithubActions/master/csv/testing.csv')).text());
    const json = csv2Json(csv).data;
    
    const allPrimarySource = [];
    json.forEach(obj => {
        if(obj['Primary Source'] && obj['Primary Source'] !== ' Recruitment' && allPrimarySource.indexOf(obj['Primary Source']) === -1) {
            allPrimarySource.push(obj['Primary Source']);
        }
    })
    
    const treeData = {
        "name": "Connect Study",
        "children": []
    };
    allPrimarySource.forEach(dt => {
        const filteredData = data.filter(obj => obj['Variable Name'] === dt);
        if(filteredData.length < 1) return
        const subcollections = filteredData[0].subcollections.map(sc => { return {name: sc.replace('.json', ''), children: []}});
        subcollections.forEach(obj => {
            const nestedSubCollection = data.filter(d => d['conceptId'] === obj.name)
            if(nestedSubCollection.length > 0 && nestedSubCollection[0]['Format/Value'] && typeof(nestedSubCollection[0]['Format/Value']) == 'object') obj.children = [...Object.keys(nestedSubCollection[0]['Format/Value']).map(c => { return {name: c.replace('.json', '')}})]
            else obj.children.push({name: nestedSubCollection[0].conceptId, children: []})
        })
        treeData.children.push({name: filteredData[0].conceptId, children: [...subcollections]})
    });
    const root = d3.hierarchy(treeData);
    
    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
        d.id = i;
        d._children = d.children;
        if (d.depth) d.children = null;
    });

    const width = 900;
    const svg = d3.select("#collapsibleTree").append("svg")
        .attr("viewBox", [-margin.left, -margin.top, width, dx])
        .style("font", "10px sans-serif")
        .style("user-select", "none");

    d3.select("#collapsibleTree")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    const gLink = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);
    
    const gNode = svg.append("g")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all");

    
    async function update(source) {
        const duration = d3.event && d3.event.altKey ? 2500 : 250;
        const nodes = root.descendants().reverse();
        const links = root.links();
    
        // Compute the new tree layout.
        tree(root);
    
        let left = root;
        let right = root;
        root.eachBefore(node => {
            if (node.x < left.x) left = node;
            if (node.x > right.x) right = node;
        });
    
        const height = right.x - left.x + margin.top + margin.bottom;
    
        const transition = svg.transition()
            .duration(duration)
            .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
            .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));
    
        // Update the nodes…
        const node = gNode.selectAll("g")
        .data(nodes, d => d.id);
    
        // Enter any new nodes at the parent's previous position.
        const nodeEnter = node.enter().append("g")
                .attr("transform", d => `translate(${source.y0},${source.x0})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0)
                .on("click", (event, d) => {
                    d.children = d.children ? null : d._children;
                    update(d);
                });
    
        nodeEnter.append("circle")
            .attr("r", 5)
            .attr("fill", d => d._children ? "#555" : "#999")
            .attr("stroke-width", 15)
            .on('mouseover', function(event, d) {
                const tmp = JSON.parse(JSON.stringify(data))
                const filteredData = tmp.filter(obj => obj.conceptId === d.data.name)
                if(filteredData.length < 1) return;
                delete filteredData[0].conceptId;
                delete filteredData[0].subcollections;
                delete filteredData[0]['Format/Value'];
                let html = '<div class="align-left">';
                for(let key in filteredData[0]){
                    html += `<div class="break-line"><b>${key}</b>: ${filteredData[0][key]}</div>`
                }
                html += '</div>'
                d3.select('.tooltip')
                .html(html)
                .style('left', event.clientX + 5 + 'px')
                .style('top', event.clientY + 15 + 'px')
                .transition()
                .duration(500)
                .style('opacity', 1)
            })
            .on('mouseleave', function() {
                d3.select('.tooltip').style('opacity', 0)
            });
    
        nodeEnter.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d._children ? -6 : 6)
            .attr("text-anchor", d => d._children ? "end" : "start")
            .text(d => d.data.name)
            .clone(true).lower()
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "white");
    
        // Transition nodes to their new position.
        node.merge(nodeEnter).transition(transition)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);
    
        // Transition exiting nodes to the parent's new position.
        node.exit().transition(transition).remove()
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);
    
        // Update the links…
        const link = gLink.selectAll("path")
            .data(links, d => d.target.id);
    
        // Enter any new links at the parent's previous position.
        const linkEnter = link.enter().append("path")
            .attr("d", d => {
                const o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });
    
        link.merge(linkEnter).transition(transition)
            .attr("d", diagonal);
    
        // Transition exiting nodes to the parent's new position.
        link.exit().transition(transition).remove()
            .attr("d", d => {
                const o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            });
    
        root.eachBefore(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }
    
    update(root);
}

const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)

const dx = 20;
const dy = 159;
const margin = ({top: 10, right: 120, bottom: 10, left: 80})

const tree = d3.tree().nodeSize([dx, dy])

const csv2Json = (csv) => {
    const lines = csv.replace(/"/g,'').split(/[\r\n]+/g);
    const result = [];
    const headers = lines[0].replace(/"/g,'').split(/[,\t]/g);
    for(let i=1; i < lines.length; i++){
        const obj = {};
        const currentline = lines[i].split(/[,\t]/g);
        for(let j = 0; j<headers.length; j++){
            if(currentline[j]){
                let value = headers[j];
                obj[value] = currentline[j];
            }
        }
        if(Object.keys(obj).length > 0) result.push(obj);
    }
    return {data:result, headers};
}