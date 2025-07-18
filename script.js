const tableBody = document.getElementById('consent-table-body');
const addRowBtn = document.getElementById('add-row-btn');
const saveTableBtn = document.getElementById('save-table-btn');

// Save table data (rows and headers) to cookie
function saveTableToCookie() {
    const rows = [];
    tableBody.querySelectorAll('tr').forEach(tr => {
        const inputs = Array.from(tr.querySelectorAll('textarea')).map(input => input.value);
        if (inputs.length) rows.push(inputs);
    });

    // Save headers
    const headers = [];
    document.querySelectorAll('thead input').forEach(input => {
        headers.push(input.value);
    });

    // Save meta info
    const userName = document.getElementById('user-name').value || '';

    const tableData = { headers, rows, userName };
    
    document.cookie = "consentTable=" + encodeURIComponent(JSON.stringify(tableData)) + ";max-age=" + 60 * 60 * 24 * 365 + "; path=/";
}

// Load table data (rows and headers) from cookie
function loadTableFromCookie() {
    const match = document.cookie.match(/(?:^|; )consentTable=([^;]*)/);
    if (match) {
        const tableData = JSON.parse(decodeURIComponent(match[1]));
        // Load headers
        if (tableData.headers) {
            document.querySelectorAll('thead input').forEach((input, idx) => {
                input.value = tableData.headers[idx] || '';
            });
        }
        // Load rows
        tableBody.innerHTML = '';
        if (tableData.rows) {
            tableData.rows.forEach(rowData => {
                const row = createRow();
                row.querySelectorAll('textarea').forEach((textarea, idx) => {
                    textarea.value = rowData[idx] || '';
                });
                tableBody.appendChild(row);
            });
        }
        // Load meta info
        if (tableData.userName !== undefined) {
            document.getElementById('user-name').value = tableData.userName;
        }
    }
}

function createRow() {
    const row = document.createElement('tr');
    for (let i = 1; i <= 5; i++) {
        const td = document.createElement('td');
        const textarea = document.createElement('textarea');
        textarea.name = `row${tableBody.rows.length + 1}col${i}`;
        textarea.setAttribute('aria-label', `Row ${tableBody.rows.length + 1} Column ${i}`);
        td.appendChild(textarea);
        row.appendChild(td);
    }
    const removeTd = document.createElement('td');
    removeTd.className = 'delete-column';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-row-btn';
    removeBtn.setAttribute('aria-label', 'Remove row');
    removeBtn.textContent = 'X';
    removeBtn.addEventListener('click', () => {
        row.remove();
    });
    removeTd.appendChild(removeBtn);
    row.appendChild(removeTd);
    return row;
}

addRowBtn.addEventListener('click', () => {
    tableBody.appendChild(createRow());
});

saveTableBtn.addEventListener('click', saveTableToCookie);

// Attach remove event to initial rows
tableBody.querySelectorAll('.remove-row-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        btn.closest('tr').remove();
    });
});

// Load table from cookie on page load
window.addEventListener('DOMContentLoaded', loadTableFromCookie);

document.getElementById('clear-table-btn').addEventListener('click', function() {
    // Remove all rows from the table body
    const tbody = document.getElementById('consent-table-body');
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    // Remove the cookie (if any)
    document.cookie = "consentTable=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
});

function exportTableToPNG() {
    // Remove last column (delete buttons) from table
    const table = document.querySelector('table');
    const theadRow = table.querySelector('thead tr');
    const tbodyRows = table.querySelectorAll('tbody tr');

    // Store removed elements for restoration
    const removedTh = theadRow.removeChild(theadRow.lastElementChild);
    const removedTds = [];
    tbodyRows.forEach(row => {
        // Unset width before removal
        row.lastElementChild.style.width = '';
        row.lastElementChild.style.minWidth = '';
        row.lastElementChild.style.maxWidth = '';
        removedTds.push(row.removeChild(row.lastElementChild));
    });
    // Unset width for header
    removedTh.style.width = '';
    removedTh.style.minWidth = '';
    removedTh.style.maxWidth = '';

    // Hide other elements
    const elementsToHide = [
        ...document.querySelectorAll('button'),
        ...document.querySelectorAll('p'),
        ...document.querySelectorAll('footer'),
    ];
    elementsToHide.forEach(el => el.style.visibility = 'hidden');

    // Get page background
    const pageBg = window.getComputedStyle(document.body).background || '#f5f7fa';

    window.scrollTo(0, 0);

    // Wait for the browser to reflow and repaint (table readjustment)
    setTimeout(() => {
        html2canvas(document.body, {
            backgroundColor: pageBg
        }).then(canvas => {
            // Restore last column and its width
            removedTh.style.width = '50px';
            removedTh.style.minWidth = '50px';
            removedTh.style.maxWidth = '50px';
            theadRow.appendChild(removedTh);
            tbodyRows.forEach((row, i) => {
                removedTds[i].style.width = '50px';
                removedTds[i].style.minWidth = '50px';
                removedTds[i].style.maxWidth = '50px';
                row.appendChild(removedTds[i]);
            });

            // Restore hidden elements
            elementsToHide.forEach(el => el.style.visibility = '');

            const link = document.createElement('a');
            link.download = 'table.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }, 300); // Increased timeout for table adjustment
}

