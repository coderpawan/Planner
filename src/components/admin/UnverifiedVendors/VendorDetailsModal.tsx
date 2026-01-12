'use client'

import { useState, useEffect } from 'react'
import { UnverifiedVendor } from '@/app/admin/unverified-vendors/page'
import { 
  MdClose, MdBusiness, MdPerson, MdPhone, MdEmail, MdLocationOn, 
  MdCategory, MdWorkHistory, MdCalendarToday, MdCheckCircle, 
  MdCancel, MdPersonAdd, MdAssignment, MdDelete, MdComment, MdSend
} from 'react-icons/md'
import { 
  doc, updateDoc, serverTimestamp, collection, getDocs, 
  query, where, addDoc, deleteDoc, arrayUnion
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase-config'

interface VendorDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  vendor: UnverifiedVendor
  onUpdate: () => void
}

interface Admin {
  name: string
  phoneNumber: string
}

export default function VendorDetailsModal({ 
  isOpen, 
  onClose, 
  vendor, 
  onUpdate 
}: VendorDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [showAssignList, setShowAssignList] = useState(false)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [searchAdmin, setSearchAdmin] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)

  const loggedInPhone = typeof window !== 'undefined' ? localStorage.getItem('phone') : null
  const loggedInName = typeof window !== 'undefined' ? localStorage.getItem('name') : null
  const loggedInRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null

  const canVerifyOrReject = 
    vendor.verificationStatus === 'assigned' &&
    vendor.assignment?.assignedTo.phoneNumber === loggedInPhone &&
    loggedInRole === 'Admin'

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (showAssignList) {
      fetchAdmins()
    }
  }, [showAssignList])

  if (!isOpen) return null

  const fetchAdmins = async () => {
    try {
      const adminsRef = collection(firestore, 'Admins')
      const snapshot = await getDocs(adminsRef)
      const adminsList = snapshot.docs.map(doc => doc.data() as Admin)
      setAdmins(adminsList)
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }

  const handleAssignToMe = async () => {
    if (!loggedInPhone || !loggedInName) {
      alert('Admin details not found in localStorage')
      return
    }

    setLoading(true)
    try {
      const vendorRef = doc(firestore, 'UnverifiedVendors', vendor.id)
      await updateDoc(vendorRef, {
        verificationStatus: 'assigned',
        assignment: {
          assignedBy: { name: loggedInName, phoneNumber: loggedInPhone },
          assignedTo: { name: loggedInName, phoneNumber: loggedInPhone },
          assignedAt: serverTimestamp()
        }
      })
      onUpdate()
    } catch (error) {
      console.error('Error assigning vendor:', error)
      alert('Failed to assign vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToSomeone = async (admin: Admin) => {
    if (!loggedInPhone || !loggedInName) {
      alert('Admin details not found in localStorage')
      return
    }

    setLoading(true)
    try {
      const vendorRef = doc(firestore, 'UnverifiedVendors', vendor.id)
      await updateDoc(vendorRef, {
        verificationStatus: 'assigned',
        assignment: {
          assignedBy: { name: loggedInName, phoneNumber: loggedInPhone },
          assignedTo: { name: admin.name, phoneNumber: admin.phoneNumber },
          assignedAt: serverTimestamp()
        }
      })
      setShowAssignList(false)
      onUpdate()
    } catch (error) {
      console.error('Error assigning vendor:', error)
      alert('Failed to assign vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyVendor = async () => {
    if (!confirm('Are you sure you want to verify this vendor?')) return

    setLoading(true)
    try {
      console.log('Starting vendor verification for:', vendor.phoneNumber)
      
      // Ensure phone numbers are in +91 format
      const primaryPhone = vendor.phoneNumber.startsWith('+91') 
        ? vendor.phoneNumber 
        : `+91${vendor.phoneNumber}`
      
      const altPhone = vendor.alternativePhoneNumber 
        ? (vendor.alternativePhoneNumber.startsWith('+91') 
            ? vendor.alternativePhoneNumber 
            : `+91${vendor.alternativePhoneNumber}`)
        : null
      
      // 1. Create document in VerifiedVendors
      const verifiedVendorData = {
        active: "true",
        businessName: vendor.businessName,
        ownerName: vendor.ownerName,
        phoneNumber: primaryPhone, // Ensure +91 prefix
        alternativePhoneNumber: altPhone, // Ensure +91 prefix if exists
        email: vendor.email || null,
        cities: vendor.cities,
        serviceCategories: vendor.serviceCategories,
        yearsOfExperience: vendor.yearsOfExperience,
        verifiedAt: serverTimestamp(),
        verifiedBy: { name: loggedInName, phoneNumber: loggedInPhone }
      }
      
      console.log('Creating VerifiedVendors document...')
      const verifiedVendorRef = await addDoc(
        collection(firestore, 'VerifiedVendors'),
        verifiedVendorData
      )
      console.log('VerifiedVendors document created with ID:', verifiedVendorRef.id)

      // 2. Update Users collection with vendor role and vendorId
      console.log('Searching for user with phone:', primaryPhone)
      const usersRef = collection(firestore, 'Users')
      const q = query(usersRef, where('phoneNumber', '==', primaryPhone))
      const userSnapshot = await getDocs(q)

      if (!userSnapshot.empty) {
        console.log('User found, updating role...')
        const userDoc = userSnapshot.docs[0]
        await updateDoc(doc(firestore, 'Users', userDoc.id), {
          role: 'Vendor',
          vendorId: verifiedVendorRef.id
        })
        console.log('User role updated successfully')
      } else {
        console.warn('⚠️ No user found with phone:', primaryPhone)
        console.log('Continuing without updating user role...')
      }

      // 3. Delete from UnverifiedVendors
      console.log('Deleting from UnverifiedVendors...')
      await deleteDoc(doc(firestore, 'UnverifiedVendors', vendor.id))
      console.log('Vendor verified successfully!')

      alert('Vendor verified successfully!')
      onUpdate()
    } catch (error: any) {
      console.error('❌ Error verifying vendor:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to verify vendor. '
      if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Please check Firestore security rules.'
      } else if (error.code === 'not-found') {
        errorMessage += 'Document not found.'
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Please try again or contact support.'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectVendor = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setLoading(true)
    try {
      const vendorRef = doc(firestore, 'UnverifiedVendors', vendor.id)
      await updateDoc(vendorRef, {
        verificationStatus: 'rejected',
        rejection: {
          rejectedBy: { name: loggedInName, phoneNumber: loggedInPhone },
          rejectedAt: serverTimestamp(),
          reason: rejectReason
        }
      })
      setShowRejectModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error rejecting vendor:', error)
      alert('Failed to reject vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVendor = async () => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this vendor? This action cannot be undone.')) {
      setShowDeleteConfirm(false)
      return
    }

    setLoading(true)
    try {
      await deleteDoc(doc(firestore, 'UnverifiedVendors', vendor.id))
      alert('Vendor deleted permanently')
      onUpdate()
    } catch (error) {
      console.error('Error deleting vendor:', error)
      alert('Failed to delete vendor')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment')
      return
    }

    if (!loggedInPhone || !loggedInName) {
      alert('Admin details not found')
      return
    }

    setIsAddingComment(true)
    try {
      const now = new Date()
      const timestampReadable = new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(now)

      const commentData = {
        adminName: loggedInName,
        adminPhone: loggedInPhone,
        comment: newComment.trim(),
        timestampReadable
      }

      const vendorRef = doc(firestore, 'UnverifiedVendors', vendor.id)
      
      // Check if comments field exists, if not initialize it as an array
      if (!vendor.comments || vendor.comments.length === 0) {
        await updateDoc(vendorRef, {
          comments: [commentData]
        })
      } else {
        await updateDoc(vendorRef, {
          comments: arrayUnion(commentData)
        })
      }

      setNewComment('')
      alert('Comment added successfully')
      onUpdate()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment. Please try again.')
    } finally {
      setIsAddingComment(false)
    }
  }

  const filteredAdmins = admins.filter(admin =>
    (admin.name?.toLowerCase() || '').includes(searchAdmin.toLowerCase()) ||
    (admin.phoneNumber || '').includes(searchAdmin)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Vendor Details</h2>
            <p className="text-sm text-white/90">Review and manage vendor application</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <MdClose className="text-2xl text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Business Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MdBusiness className="text-purple-600" />
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Business Name</label>
                  <p className="text-base font-semibold text-gray-900">{vendor.businessName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Owner Name</label>
                  <p className="text-base font-semibold text-gray-900">{vendor.ownerName}</p>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MdPhone className="text-pink-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Primary Phone</label>
                  <p className="text-base font-semibold text-gray-900">
                    {vendor.phoneNumber.startsWith('+91') 
                      ? vendor.phoneNumber 
                      : `+91${vendor.phoneNumber}`}
                  </p>
                </div>
                {vendor.alternativePhoneNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Alternative Phone</label>
                    <p className="text-base font-semibold text-gray-900">
                      {vendor.alternativePhoneNumber.startsWith('+91') 
                        ? vendor.alternativePhoneNumber 
                        : `+91${vendor.alternativePhoneNumber}`}
                    </p>
                  </div>
                )}
                {vendor.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      <MdEmail className="inline mr-1" />
                      Email
                    </label>
                    <p className="text-base font-semibold text-gray-900">{vendor.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MdCategory className="text-orange-600" />
                Service Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Service Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {vendor.serviceCategories.map((cat, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    <MdWorkHistory className="inline mr-1" />
                    Years of Experience
                  </label>
                  <p className="text-base font-semibold text-gray-900">{vendor.yearsOfExperience} years</p>
                </div>
              </div>
            </div>

            {/* Cities */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MdLocationOn className="text-red-600" />
                Operational Cities
              </h3>
              <div className="flex flex-wrap gap-2">
                {vendor.cities.map((cityObj, idx) => (
                  <div key={idx} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                    <div className="font-bold">{cityObj.city}</div>
                    <div className="text-xs">{cityObj.state}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamps & Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MdCalendarToday className="text-green-600" />
                Application Details
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Submitted At</label>
                  <p className="text-base font-semibold text-gray-900">{vendor.createdAtReadable}</p>
                </div>
                {vendor.assignment && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Assignment Details</label>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm"><span className="font-medium">Assigned To:</span> {vendor.assignment.assignedTo.name}</p>
                      <p className="text-sm"><span className="font-medium">Phone:</span> {vendor.assignment.assignedTo.phoneNumber}</p>
                      <p className="text-sm"><span className="font-medium">Assigned By:</span> {vendor.assignment.assignedBy.name}</p>
                    </div>
                  </div>
                )}
                {vendor.rejection && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Rejection Details</label>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm"><span className="font-medium">Rejected By:</span> {vendor.rejection.rejectedBy.name}</p>
                      <p className="text-sm"><span className="font-medium">Reason:</span> {vendor.rejection.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MdComment className="text-blue-600" />
                Comments
              </h3>
              
              {/* Add New Comment */}
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={isAddingComment || !newComment.trim()}
                  className="mt-2 px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <MdSend className="text-lg" />
                  {isAddingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {vendor.comments && vendor.comments.length > 0 ? (
                  vendor.comments.map((comment, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{comment.adminName}</p>
                          <p className="text-xs text-gray-500">{comment.timestampReadable}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          {vendor.verificationStatus === 'unverified' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAssignToMe}
                  disabled={loading}
                  className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <MdPersonAdd className="text-xl" />
                  Assign to Me
                </button>
                <button
                  onClick={() => setShowAssignList(true)}
                  disabled={loading}
                  className="flex-1 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <MdAssignment className="text-xl" />
                  Assign to Someone Else
                </button>
              </div>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="w-full py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <MdDelete className="text-xl" />
                Delete Permanently
              </button>
            </div>
          )}

          {vendor.verificationStatus === 'assigned' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAssignToMe}
                  disabled={loading}
                  className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <MdPersonAdd className="text-xl" />
                  Reassign to Me
                </button>
                <button
                  onClick={() => setShowAssignList(true)}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <MdAssignment className="text-xl" />
                  Reassign to Someone Else
                </button>
              </div>

              {canVerifyOrReject && (
                <div className="flex gap-3">
                  <button
                    onClick={handleVerifyVendor}
                    disabled={loading}
                    className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <MdCheckCircle className="text-xl" />
                    Verify Vendor
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={loading}
                    className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <MdCancel className="text-xl" />
                    Reject Vendor
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="w-full py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <MdDelete className="text-xl" />
                Delete Permanently
              </button>
            </div>
          )}

          {vendor.verificationStatus === 'rejected' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAssignToMe}
                  disabled={loading}
                  className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <MdPersonAdd className="text-xl" />
                  Reassign to Me
                </button>
                <button
                  onClick={() => setShowAssignList(true)}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <MdAssignment className="text-xl" />
                  Reassign to Someone Else
                </button>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="w-full py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <MdDelete className="text-xl" />
                Delete Permanently
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assign to Someone Modal */}
      {showAssignList && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Select Admin</h3>
              <button
                onClick={() => setShowAssignList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            <input
              type="text"
              value={searchAdmin}
              onChange={(e) => setSearchAdmin(e.target.value)}
              placeholder="Search admin by name or phone..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredAdmins.map((admin, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAssignToSomeone(admin)}
                  disabled={loading}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors disabled:opacity-50"
                >
                  <p className="font-semibold text-gray-900">{admin.name}</p>
                  <p className="text-sm text-gray-600">{admin.phoneNumber}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reject Vendor</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />

            <button
              onClick={handleRejectVendor}
              disabled={loading || !rejectReason.trim()}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-600">Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to permanently delete <strong>{vendor.businessName}</strong>? 
              This action cannot be undone and all vendor data will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVendor}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <MdDelete className="text-xl" />
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
