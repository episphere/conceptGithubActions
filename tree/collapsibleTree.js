window.onload = () => {
    renderTree();
}

const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)

const dx = 20;
const dy = 159;
const margin = ({top: 10, right: 120, bottom: 10, left: 80})

const tree = d3.tree().nodeSize([dx, dy])

const nodesClicked = [];

const getData = async (file) => {
    const api = `https://raw.githubusercontent.com/episphere/conceptGithubActions/master/${file}`;
    const response = await fetch(api)
    const concepts = await response.json();
    return concepts;
}

const treeDataBuilder = (hierarchy) => {
    let obj = {
        "name": "Connect Study",
        "children": []
    }
    obj.children = extractNextedObjects(hierarchy)
    return obj;
}

const extractNextedObjects = (obj) => {
    let array = [];
    for(let concept in obj) {
        let nestedObject = {}
        if(Object.keys(obj[concept]).length > 0) nestedObject = {"name": concept, "children": []};
        else nestedObject = {"name": concept}
        nestedObject.children = extractNextedObjects(obj[concept])
        array.push(nestedObject)
    }
    return array;
}

const renderTree = async () => {
    const data = await getData('collapsibleTree.json');
    let hierarchy = {};
    data.forEach(obj => {
        if(!obj['Primary Source']) return;
        const primaryConcept = obj['Primary Source'].replace('.json', '');
        if(hierarchy[primaryConcept] === undefined) hierarchy[primaryConcept] = {};
        if(obj['Secondary Source'] && hierarchy[primaryConcept][obj['Secondary Source'].replace('.json', '')] === undefined) hierarchy[primaryConcept][obj['Secondary Source'].replace('.json', '')] = {};
        if(obj['Secondary Source'] && obj['conceptId']) {
            hierarchy[primaryConcept][obj['Secondary Source'].replace('.json', '')][obj['conceptId']] = {};
            if(obj['subcollections']) {
                obj['subcollections'].forEach(collection => {
                    hierarchy[primaryConcept][obj['Secondary Source'].replace('.json', '')][obj['conceptId']][collection.replace('.json', '')] = {};
                })
            }
            if(obj['Format/Value']) {
                if(typeof(obj['Format/Value']) === 'object') {
                    for(let value in obj['Format/Value']){
                        hierarchy[primaryConcept][obj['Secondary Source'].replace('.json', '')][obj['conceptId']][value.replace('.json', '')] = {};
                    }
                }
            }
        }
    })

    const treeData = treeDataBuilder(hierarchy);

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

    
    const update = async (source) => {
        const duration = d3.event && d3.event.altKey ? 2500 : 250;
        const nodes = root.descendants().reverse();
        const links = root.links();
    
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
    
        const node = gNode.selectAll("g")
        .data(nodes, d => d.id);
        
        let tooltipCounter;
        
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
            .on('click', function (e, d) {
                const node = d.data.name;
                location.hash = node;
                const currentNode = d3.select(this)._groups[0][0];
                
                if(d.children) d3.select(currentNode).attr("fill", d => d._children ? '#555' : '#999')
                else d3.select(currentNode).attr('fill', '#577eba')
                
                d3.selectAll('path').select(function (d) {
                    if(d.target.data.name === node){
                        if(d.target.children) d3.select(this).attr('stroke', '#555').attr('stroke-width', 1.5);
                        else d3.select(this).attr('stroke', '#577eba').attr('stroke-width', 3);
                    }
                })
                
                d3.select('.tooltip').style('opacity', 0)
            })
            .on('mouseover', function(event, d) {
                tooltipCounter = setTimeout(() => {
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
                    .style('opacity', 1)
                }, 500)
            })
            .on('mouseleave', function() {
                clearTimeout(tooltipCounter);
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
    
        node.merge(nodeEnter).transition(transition)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);
    
        node.exit().transition(transition).remove()
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);
    
        const link = gLink.selectAll("path")
            .data(links, d => d.target.id);
    
        const linkEnter = link.enter().append("path")
            .attr("d", d => {
                const o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });
    
        link.merge(linkEnter).transition(transition)
            .attr("d", diagonal);
    
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

    document.getElementById('collapseAll').addEventListener('click', () => {
        collapseHandler(root)
    });
    
    document.getElementById('search').addEventListener('submit', e => {
        e.preventDefault();
        const input = document.getElementById('conceptId').value.trim();
        if(input){
            handleSearch(input)
        }
    });

    const triggerNodeSearch = (term) => {
        d3.selectAll('circle').select(function (d) {
            if(d.data.name === term) {
                const event = document.createEvent('MouseEvents');
                event.initMouseEvent('click');
                this.dispatchEvent(event)
                d.children = d.children ? null : d._children;
                update(d);
            }
        })
    }
    const handleSearch = (input) => {
        const filteredData = data.filter(dt => dt.conceptId === input);
        if(filteredData.length === 0) return;
        d3.selectAll('path').select(function(d) {
            d3.select(this).attr('stroke', '#555').attr('stroke-width', 1.5);
        })
        d3.selectAll('circle').select(function(d) {
            d3.select(this).attr("fill", d => d._children ? "#555" : "#999");
        })
        collapseHandler(root);
        const cid = filteredData[0]['conceptId'];
        triggerNodeSearch('Connect Study');
        if(filteredData[0]['Primary Source']) triggerNodeSearch(filteredData[0]['Primary Source'].replace('.json', ''));
        if(filteredData[0]['Secondary Source']) triggerNodeSearch(filteredData[0]['Secondary Source'].replace('.json', ''));
        triggerNodeSearch(cid);
    }

    const collapseHandler = (root) => {
        if(!root.children) return;
        root.children.forEach(collapse);
        collapse(root);
        update(root);
    }

    const hash = location.hash.replace('#', '').trim();
    if(hash) {
        document.getElementById('conceptId').value = hash;
        handleSearch(hash)
    }
}

const collapse = (d) => {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
}
