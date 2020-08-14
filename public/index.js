const api = 'https://raw.githubusercontent.com/episphere/conceptGithubActions/master/jsons/';

window.onload = () => {
    renderConcepts();
}

const renderConcepts = async () => {
    const response = await fetch(`${api}varToConcept.json`)
    const concepts = await response.json();
    let template = '<div class="accordion" id="accordionExample">';
    for(let key in concepts) {
        template += `
        <div class="card">
            <div class="card-header" id="heading${concepts[key]}">
                <a class="btn btn-link collapsable-btn" href="#${concepts[key]}" role="button" data-toggle="collapse" data-target="#id${concepts[key]}" aria-expanded="true" aria-controls="id${concepts[key]}">
                    <div class="row">
                        <div class="col">${concepts[key]}</div>
                        <div class="ml-auto">${key}</div>
                    </div>
                </a>
            </div>
            <div id="id${concepts[key]}" class="collapse" aria-labelledby="heading${concepts[key]}" data-parent="#accordionExample">
                <div class="card-body"></div>
            </div>
        </div>
        `
    }
    template += '</div>'
    document.getElementById('root').innerHTML = template;
    addEventTriggerCollapse();
    manageScroll();
}

const addEventTriggerCollapse = () => {
    const btns = document.getElementsByClassName('collapsable-btn');
    Array.from(btns).forEach(btn => {
        btn.addEventListener('click', async () => {
            const element = btn.parentNode.nextElementSibling;
            if(element.classList.contains('show')) element.classList.remove('show');
            else {
                let template = '';
                const cardBody = element.querySelectorAll('[class="card-body"]')[0];
                const response = await fetch(`${api}${element.id.replace('id', '')}.json`)
                const data = await response.json();
                for(let key in data) {
                    template += `<div><strong>${key}: </strong>&nbsp;`
                    if(typeof data[key] === 'object') {
                        template += `<pre>${JSON.stringify(data[key])}</pre>`;
                    }
                    else {
                        const url = /https:/i.test(data[key]);
                        template += `${url ? `<a href="${data[key]}" target="_blank">${data[key]}<a>` : data[key]}</div>`;
                    }
                }
                cardBody.innerHTML = template;
                element.classList.add('show');
            }
        })
    })
}

const manageScroll = () => {
    const hash = location.hash;
    const element = document.getElementById(hash.replace('#', 'heading'));
    element.scrollIntoView();
}