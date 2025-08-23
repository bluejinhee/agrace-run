// 데이터 저장소
let members = JSON.parse(localStorage.getItem('runningClubMembers')) || [];
let records = JSON.parse(localStorage.getItem('runningClubRecords')) || [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    updateMemberList();
});

// 멤버 추가
function addMember() {
    const nameInput = document.getElementById('memberName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('이름을 입력해주세요!');
        return;
    }
    
    if (members.find(member => member.name === name)) {
        alert('이미 등록된 멤버입니다!');
        return;
    }
    
    const newMember = {
        id: Date.now(),
        name: name,
        totalDistance: 0,
        recordCount: 0,
        joinDate: new Date().toLocaleDateString('ko-KR')
    };
    
    members.push(newMember);
    saveData();
    updateMemberList();
    
    nameInput.value = '';
    alert(`${name}님이 런닝크루에 가입했습니다! 🎉`);
}

// 멤버 삭제
function removeMember(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const confirmDelete = confirm(`${member.name}님을 정말 삭제하시겠습니까?\n관련된 모든 기록도 함께 삭제됩니다.`);
    
    if (confirmDelete) {
        // 멤버 삭제
        members = members.filter(m => m.id !== memberId);
        
        // 해당 멤버의 기록도 모두 삭제
        records = records.filter(r => r.memberId !== memberId);
        
        saveData();
        updateMemberList();
        alert(`${member.name}님이 삭제되었습니다.`);
    }
}

// 멤버 이름 수정
function editMemberName(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const newName = prompt(`새로운 이름을 입력하세요:`, member.name);
    
    if (newName && newName.trim() !== '') {
        const trimmedName = newName.trim();
        
        // 중복 이름 체크 (자기 자신 제외)
        if (members.find(m => m.name === trimmedName && m.id !== memberId)) {
            alert('이미 존재하는 이름입니다!');
            return;
        }
        
        member.name = trimmedName;
        saveData();
        updateMemberList();
        alert(`이름이 ${trimmedName}으로 변경되었습니다.`);
    }
}

// 멤버 목록 업데이트
function updateMemberList() {
    const memberListDiv = document.getElementById('memberList');
    
    if (members.length === 0) {
        memberListDiv.innerHTML = '<div class="no-members">등록된 멤버가 없습니다.</div>';
        return;
    }
    
    // 이름순으로 정렬
    const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));
    
    memberListDiv.innerHTML = '';
    
    sortedMembers.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        
        memberItem.innerHTML = `
            <div class="member-info">
                <div class="member-name-admin">${member.name}</div>
                <div class="member-details">
                    <span>총 거리: ${member.totalDistance.toFixed(1)}km</span>
                    <span>출석: ${member.recordCount}회</span>
                    <span>가입일: ${member.joinDate}</span>
                </div>
            </div>
            <div class="member-actions">
                <button onclick="editMemberName(${member.id})" class="edit-button">✏️ 수정</button>
                <button onclick="removeMember(${member.id})" class="delete-button">🗑️ 삭제</button>
            </div>
        `;
        
        memberListDiv.appendChild(memberItem);
    });
}

// 데이터 내보내기
function exportData() {
    const data = {
        members: members,
        records: records,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `running-club-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert('데이터가 다운로드되었습니다! 📤');
}

// 데이터 가져오기 버튼 클릭
function importData() {
    document.getElementById('importFile').click();
}

// 파일 가져오기 처리
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.members && data.records) {
                const confirmImport = confirm('기존 데이터를 모두 덮어쓰시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
                
                if (confirmImport) {
                    members = data.members;
                    records = data.records;
                    saveData();
                    updateMemberList();
                    alert('데이터가 성공적으로 가져와졌습니다! 📥');
                }
            } else {
                alert('올바르지 않은 데이터 형식입니다.');
            }
        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다.');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // 파일 입력 초기화
}

// 모든 데이터 초기화
function resetData() {
    const confirmReset = confirm('정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
    
    if (confirmReset) {
        const doubleConfirm = confirm('마지막 확인입니다.\n모든 멤버와 기록이 영구적으로 삭제됩니다.');
        
        if (doubleConfirm) {
            members = [];
            records = [];
            saveData();
            updateMemberList();
            alert('모든 데이터가 삭제되었습니다.');
        }
    }
}

// 데이터 저장
function saveData() {
    localStorage.setItem('runningClubMembers', JSON.stringify(members));
    localStorage.setItem('runningClubRecords', JSON.stringify(records));
}