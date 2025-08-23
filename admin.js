// 데이터 저장소
let members = [];
let records = [];
let schedules = [];

// 초기 데이터 로드
async function initializeData() {
    const data = await loadFromCloud();
    members = data.members || [];
    records = data.records || [];
    schedules = data.schedules || [];
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 로딩 표시
    showLoading(true);
    
    try {
        // 클라우드에서 데이터 로드
        await initializeData();
        
        // UI 업데이트
        updateMemberList();
        updateScheduleList();
        updateRecordManagementList();
        
        // 연결 상태 업데이트
        await updateConnectionStatus();
        
    } catch (error) {
        console.error('초기화 오류:', error);
        alert('데이터 로드 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
    } finally {
        showLoading(false);
    }
    
    // 모달 외부 클릭 시 닫기
    document.getElementById('editScheduleModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });
    
    document.getElementById('editRecordModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditRecordModal();
        }
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeEditModal();
            closeEditRecordModal();
        }
    });
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
    alert(name + '님이 런닝크루에 가입했습니다! 🎉');
}

// 멤버 삭제
function removeMember(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const confirmDelete = confirm(member.name + '님을 정말 삭제하시겠습니까?\n관련된 모든 기록도 함께 삭제됩니다.');
    
    if (confirmDelete) {
        // 멤버 삭제
        members = members.filter(m => m.id !== memberId);
        
        // 해당 멤버의 기록도 모두 삭제
        records = records.filter(r => r.memberId !== memberId);
        
        saveData();
        updateMemberList();
        alert(member.name + '님이 삭제되었습니다.');
    }
}

// 멤버 이름 수정
function editMemberName(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const newName = prompt('새로운 이름을 입력하세요:', member.name);
    
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
        alert('이름이 ' + trimmedName + '으로 변경되었습니다.');
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
        
        memberItem.innerHTML = 
            '<div class="member-info">' +
                '<div class="member-name-admin">' + member.name + '</div>' +
                '<div class="member-details">' +
                    '<span>총 거리: ' + member.totalDistance.toFixed(1) + 'km</span>' +
                    '<span>출석: ' + member.recordCount + '회</span>' +
                    '<span>가입일: ' + member.joinDate + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="member-actions">' +
                '<button onclick="editMemberName(' + member.id + ')" class="edit-button">✏️ 수정</button>' +
                '<button onclick="removeMember(' + member.id + ')" class="delete-button">🗑️ 삭제</button>' +
            '</div>';
        
        memberListDiv.appendChild(memberItem);
    });
}

// 스케줄 추가
function addSchedule() {
    console.log('addSchedule 함수가 호출되었습니다!'); // 디버깅용
    
    const dateInput = document.getElementById('scheduleDate');
    const timeInput = document.getElementById('scheduleTime');
    const locationInput = document.getElementById('scheduleLocation');
    const descriptionInput = document.getElementById('scheduleDescription');
    
    const date = dateInput.value;
    const time = timeInput.value;
    const location = locationInput.value.trim();
    const description = descriptionInput.value.trim();
    
    console.log('입력값:', { date, time, location, description }); // 디버깅용
    
    if (!date) {
        alert('날짜를 선택해주세요!');
        return;
    }
    
    if (!time) {
        alert('시간을 입력해주세요!');
        return;
    }
    
    if (!location) {
        alert('장소를 입력해주세요!');
        return;
    }
    
    const newSchedule = {
        id: Date.now(),
        date: date,
        time: time,
        location: location,
        description: description || '',
        createdAt: new Date().toISOString()
    };
    
    schedules.push(newSchedule);
    saveData();
    updateScheduleList();
    
    // 입력 필드 초기화
    dateInput.value = '';
    timeInput.value = '';
    locationInput.value = '';
    descriptionInput.value = '';
    
    alert('스케줄이 추가되었습니다! 📅');
}

// 스케줄 삭제
function removeSchedule(scheduleId) {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    const confirmDelete = confirm(schedule.date + ' ' + schedule.time + ' 스케줄을 삭제하시겠습니까?');
    
    if (confirmDelete) {
        schedules = schedules.filter(s => s.id !== scheduleId);
        saveData();
        updateScheduleList();
        alert('스케줄이 삭제되었습니다.');
    }
}

// 현재 수정 중인 스케줄 ID
let currentEditingScheduleId = null;

// 스케줄 수정 모달 열기
function editSchedule(scheduleId) {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    currentEditingScheduleId = scheduleId;
    
    // 모달 필드에 현재 값 설정
    document.getElementById('editScheduleDate').value = schedule.date;
    document.getElementById('editScheduleTime').value = schedule.time;
    document.getElementById('editScheduleLocation').value = schedule.location;
    document.getElementById('editScheduleDescription').value = schedule.description;
    
    // 모달 표시
    document.getElementById('editScheduleModal').style.display = 'flex';
}

// 스케줄 수정 저장
function saveScheduleEdit() {
    if (!currentEditingScheduleId) return;
    
    const schedule = schedules.find(s => s.id === currentEditingScheduleId);
    if (!schedule) return;
    
    const newDate = document.getElementById('editScheduleDate').value;
    const newTime = document.getElementById('editScheduleTime').value;
    const newLocation = document.getElementById('editScheduleLocation').value.trim();
    const newDescription = document.getElementById('editScheduleDescription').value.trim();
    
    // 유효성 검사
    if (!newDate) {
        alert('날짜를 선택해주세요!');
        return;
    }
    
    if (!newTime) {
        alert('시간을 입력해주세요!');
        return;
    }
    
    if (!newLocation) {
        alert('장소를 입력해주세요!');
        return;
    }
    
    // 스케줄 업데이트
    schedule.date = newDate;
    schedule.time = newTime;
    schedule.location = newLocation;
    schedule.description = newDescription;
    
    saveData();
    updateScheduleList();
    closeEditModal();
    alert('스케줄이 수정되었습니다! ✅');
}

// 수정 모달 닫기
function closeEditModal() {
    document.getElementById('editScheduleModal').style.display = 'none';
    currentEditingScheduleId = null;
    
    // 입력 필드 초기화
    document.getElementById('editScheduleDate').value = '';
    document.getElementById('editScheduleTime').value = '';
    document.getElementById('editScheduleLocation').value = '';
    document.getElementById('editScheduleDescription').value = '';
}

// 스케줄 목록 업데이트
function updateScheduleList() {
    const scheduleListDiv = document.getElementById('scheduleList');
    
    if (schedules.length === 0) {
        scheduleListDiv.innerHTML = '<div class="no-schedules">등록된 스케줄이 없습니다.</div>';
        return;
    }
    
    // 날짜순으로 정렬 (최신순)
    const sortedSchedules = [...schedules].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
    });
    
    scheduleListDiv.innerHTML = '';
    
    sortedSchedules.forEach(schedule => {
        const scheduleItem = document.createElement('div');
        scheduleItem.className = 'schedule-item';
        
        const scheduleDate = new Date(schedule.date);
        const formattedDate = scheduleDate.toLocaleDateString('ko-KR');
        
        scheduleItem.innerHTML = 
            '<div class="schedule-info">' +
                '<div class="schedule-date-time">' + formattedDate + ' ' + schedule.time + '</div>' +
                '<div class="schedule-location">📍 ' + schedule.location + '</div>' +
                (schedule.description ? '<div class="schedule-description">' + schedule.description + '</div>' : '') +
            '</div>' +
            '<div class="schedule-actions">' +
                '<button onclick="editSchedule(' + schedule.id + ')" class="schedule-edit-btn">✏️</button>' +
                '<button onclick="removeSchedule(' + schedule.id + ')" class="schedule-delete-btn">🗑️</button>' +
            '</div>';
        
        scheduleListDiv.appendChild(scheduleItem);
    });
}

// 데이터 내보내기
function exportData() {
    const data = {
        members: members,
        records: records,
        schedules: schedules,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'running-club-data-' + new Date().toISOString().split('T')[0] + '.json';
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
                    schedules = data.schedules || [];
                    saveData();
                    updateMemberList();
                    updateScheduleList();
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
            schedules = [];
            saveData();
            updateMemberList();
            updateScheduleList();
            alert('모든 데이터가 삭제되었습니다.');
        }
    }
}

// 현재 수정 중인 기록 ID
let currentEditingRecordId = null;

// 기록 관리 목록 업데이트
function updateRecordManagementList() {
    const recordListDiv = document.getElementById('recordManagementList');
    
    if (records.length === 0) {
        recordListDiv.innerHTML = '<div class="no-records">등록된 기록이 없습니다.</div>';
        return;
    }
    
    // 날짜순으로 정렬 (최신순)
    const sortedRecords = [...records].sort((a, b) => {
        if (a.originalDate && b.originalDate) {
            return new Date(b.originalDate) - new Date(a.originalDate);
        }
        return b.id - a.id;
    });
    
    recordListDiv.innerHTML = '';
    
    sortedRecords.forEach(record => {
        const member = members.find(m => m.id === record.memberId);
        if (!member) return;
        
        const recordItem = document.createElement('div');
        recordItem.className = 'record-management-item';
        
        recordItem.innerHTML = `
            <div class="record-management-info">
                <div class="record-management-member">${member.name}</div>
                <div class="record-management-details">
                    <span class="record-distance-tag">${record.distance}km</span>
                    ${record.pace ? `<span class="record-pace-tag">${record.pace}/km</span>` : ''}
                </div>
                <div class="record-management-date">${record.date} ${record.time}</div>
            </div>
            <div class="record-management-actions">
                <button onclick="editRecord(${record.id})" class="edit-button">✏️ 수정</button>
                <button onclick="removeRecord(${record.id})" class="delete-button">🗑️ 삭제</button>
            </div>
        `;
        
        recordListDiv.appendChild(recordItem);
    });
}

// 기록 삭제
function removeRecord(recordId) {
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    
    const member = members.find(m => m.id === record.memberId);
    const memberName = member ? member.name : '알 수 없는 멤버';
    
    const confirmDelete = confirm(`${memberName}님의 ${record.distance}km 기록을 삭제하시겠습니까?`);
    
    if (confirmDelete) {
        // 기록 삭제
        records = records.filter(r => r.id !== recordId);
        
        // 멤버 통계 업데이트
        if (member) {
            member.totalDistance -= record.distance;
            member.recordCount -= 1;
            
            // 음수 방지
            if (member.totalDistance < 0) member.totalDistance = 0;
            if (member.recordCount < 0) member.recordCount = 0;
        }
        
        saveData();
        updateRecordManagementList();
        updateMemberList();
        alert('기록이 삭제되었습니다.');
    }
}

// 기록 수정 모달 열기
function editRecord(recordId) {
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    
    currentEditingRecordId = recordId;
    
    // 멤버 선택 드롭다운 업데이트
    const memberSelect = document.getElementById('editRecordMember');
    memberSelect.innerHTML = '';
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        if (member.id === record.memberId) {
            option.selected = true;
        }
        memberSelect.appendChild(option);
    });
    
    // 모달 필드에 현재 값 설정
    document.getElementById('editRecordDistance').value = record.distance;
    document.getElementById('editRecordPace').value = record.pace || '';
    document.getElementById('editRecordDate').value = record.originalDate || '';
    
    // 모달 표시
    document.getElementById('editRecordModal').style.display = 'flex';
}

// 기록 수정 저장
function saveRecordEdit() {
    if (!currentEditingRecordId) return;
    
    const record = records.find(r => r.id === currentEditingRecordId);
    if (!record) return;
    
    const oldMemberId = record.memberId;
    const oldDistance = record.distance;
    
    const newMemberId = parseInt(document.getElementById('editRecordMember').value);
    const newDistance = parseFloat(document.getElementById('editRecordDistance').value);
    const newPace = document.getElementById('editRecordPace').value.trim();
    const newDate = document.getElementById('editRecordDate').value;
    
    // 유효성 검사
    if (!newMemberId) {
        alert('멤버를 선택해주세요!');
        return;
    }
    
    if (!newDistance || newDistance <= 0) {
        alert('올바른 거리를 입력해주세요!');
        return;
    }
    
    if (!newDate) {
        alert('날짜를 선택해주세요!');
        return;
    }
    
    // 페이스 유효성 검사
    if (newPace && !isValidPace(newPace)) {
        alert('페이스는 분:초 형식으로 입력해주세요 (예: 5:30)');
        return;
    }
    
    // 이전 멤버 통계 업데이트 (기록 제거)
    const oldMember = members.find(m => m.id === oldMemberId);
    if (oldMember) {
        oldMember.totalDistance -= oldDistance;
        oldMember.recordCount -= 1;
        if (oldMember.totalDistance < 0) oldMember.totalDistance = 0;
        if (oldMember.recordCount < 0) oldMember.recordCount = 0;
    }
    
    // 새 멤버 통계 업데이트 (기록 추가)
    const newMember = members.find(m => m.id === newMemberId);
    if (newMember) {
        newMember.totalDistance += newDistance;
        newMember.recordCount += 1;
    }
    
    // 기록 업데이트
    const recordDate = new Date(newDate);
    const formattedDate = recordDate.toLocaleDateString('ko-KR');
    
    record.memberId = newMemberId;
    record.distance = newDistance;
    record.pace = newPace || null;
    record.date = formattedDate;
    record.originalDate = newDate;
    
    saveData();
    updateRecordManagementList();
    updateMemberList();
    closeEditRecordModal();
    alert('기록이 수정되었습니다! ✅');
}

// 기록 수정 모달 닫기
function closeEditRecordModal() {
    document.getElementById('editRecordModal').style.display = 'none';
    currentEditingRecordId = null;
    
    // 입력 필드 초기화
    document.getElementById('editRecordMember').innerHTML = '';
    document.getElementById('editRecordDistance').value = '';
    document.getElementById('editRecordPace').value = '';
    document.getElementById('editRecordDate').value = '';
}

// 페이스 유효성 검사 함수
function isValidPace(pace) {
    const pacePattern = /^[0-9]+:[0-5][0-9]$/;
    return pacePattern.test(pace);
}

// 로딩 표시 함수
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

// 데이터 저장
async function saveData() {
    await saveToCloud(members, records, schedules);
}